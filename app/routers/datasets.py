import datetime
from typing import List
import json
from bson import ObjectId
from fastapi import APIRouter, Request, HTTPException, Depends
from pymongo import MongoClient
from pydantic import Json
from fastapi.encoders import jsonable_encoder
from app import dependencies
from app.models.datasets import DatasetBase, DatasetIn, DatasetDB, DatasetOut
from app.models.files import ClowderFile
from app.auth import AuthHandler
import os
from minio import Minio

from app.models.users import UserOut

router = APIRouter()

auth_handler = AuthHandler()

clowder_bucket = os.getenv("MINIO_BUCKET_NAME", "clowder")


@router.post("", response_model=DatasetBase)
async def save_dataset(
    dataset_in: DatasetIn,
    user_id=Depends(auth_handler.auth_wrapper),
    db: MongoClient = Depends(dependencies.get_db),
):
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    dataset_db = DatasetDB(**dataset_in.dict(), author=UserOut(**user))
    new_dataset = await db["datasets"].insert_one(dataset_db.dict())
    found = await db["datasets"].find_one({"_id": new_dataset.inserted_id})
    return DatasetOut.from_mongo(found)


@router.get("", response_model=List[DatasetBase])
async def get_datasets(
    user_id=Depends(auth_handler.auth_wrapper),
    db: MongoClient = Depends(dependencies.get_db),
    skip: int = 0,
    limit: int = 2,
    mine=False,
):
    datasets = []
    if mine:
        for doc in (
            await db["datasets"]
            .find({"author": ObjectId(user_id)})
            .skip(skip)
            .limit(limit)
            .to_list(length=limit)
        ):
            datasets.append(doc)
    else:
        for doc in (
            await db["datasets"].find().skip(skip).limit(limit).to_list(length=limit)
        ):
            datasets.append(doc)
    return datasets


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, db: MongoClient = Depends(dependencies.get_db)):
    # if (
    #     dataset := await db["datasets"].find_one({"_id": ObjectId(dataset_id)})
    # ) is not None:
    #     if (
    #         user := await db["users"].find_one({"_id": ObjectId(dataset["author"])})
    #     ) is not None:
    #         dataset["author"] = user
    #         return Dataset.from_mongo(dataset)
    if (
        dataset := await db["datasets"].find_one({"_id": ObjectId(dataset_id)})
    ) is not None:
        return DatasetBase.from_mongo(dataset)
    raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")


@router.get("/{dataset_id}/files")
async def get_dataset_files(
    dataset_id: str, db: MongoClient = Depends(dependencies.get_db)
):
    if (
        dataset := await db["datasets"].find_one({"_id": ObjectId(dataset_id)})
    ) is not None:
        file_ids = dataset["files"]
        files = []
        for file_id in file_ids:
            if (
                file := await db["files"].find_one({"_id": ObjectId(file_id)})
            ) is not None:
                files.append(ClowderFile.from_mongo(file))
        return files
    raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")


@router.put("/{dataset_id}", response_model=DatasetBase)
async def edit_dataset(
    dataset_id: str,
    dataset_info: DatasetBase,
    db: MongoClient = Depends(dependencies.get_db),
):
    ds = dict(dataset_info) if dataset_info is not None else {}
    if (
        dataset := await db["datasets"].find_one({"_id": ObjectId(dataset_id)})
    ) is not None:
        try:
            dataset.update(ds)
            dataset["_id"] = dataset_id
            dataset["modified"] = datetime.datetime.utcnow()
            db["datasets"].replace_one({"_id": ObjectId(dataset_id)}, dataset)
        except Exception as e:
            print(e)
        return DatasetBase.from_mongo(dataset)
    raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")


@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    db: MongoClient = Depends(dependencies.get_db),
    fs: Minio = Depends(dependencies.get_fs),
):
    if (
        dataset := await db["datasets"].find_one({"_id": ObjectId(dataset_id)})
    ) is not None:
        dataset_files = dataset["files"]
        for f in dataset_files:
            fs.remove_object(clowder_bucket, str(f))
        res = await db["datasets"].delete_one({"_id": ObjectId(dataset_id)})
        return {"deleted": dataset_id}
    raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
