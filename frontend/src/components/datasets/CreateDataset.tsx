import React, {useEffect, useState} from "react";

import {Box, Button, Stepper, Step, StepLabel, StepContent, Typography,} from "@mui/material";
import {useDispatch, useSelector,} from "react-redux";
import {RootState} from "../../types/data";

import {CreateDatasetModal} from "./CreateDatasetModal";
import {CreateMetadata} from "../metadata/CreateMetadata";
import {UploadFile} from "../files/UploadFile";
import TopBar from "../navigation/TopBar";
import {ActionModal} from "../dialog/ActionModal";
import config from "../../app.config";
import {resetFailedReason} from "../../actions/common";
import {fetchMetadataDefinitions, postDatasetMetadata} from "../../actions/metadata";
import {MetadataIn} from "../../openapi/v2";
import {datasetCreated} from "../../actions/dataset";
import {useNavigate} from "react-router-dom";


export const CreateDataset = (): JSX.Element => {

	const dispatch = useDispatch();
	const getMetadatDefinitions = (name:string|null, skip:number, limit:number) => dispatch(fetchMetadataDefinitions(name, skip,limit));
	const createDatasetMetadata = (datasetId: string|undefined, metadata:MetadataIn) => dispatch(postDatasetMetadata(datasetId, metadata));
	const createDataset = (formData: FormData) => dispatch(datasetCreated(formData));
	const newDataset = useSelector((state:RootState) => state.dataset.newDataset);

	useEffect(() => {
		getMetadatDefinitions(null, 0, 100);
	}, []);

	// Error msg dialog
	const reason = useSelector((state: RootState) => state.error.reason);
	const stack = useSelector((state: RootState) => state.error.stack);
	const dismissError = () => dispatch(resetFailedReason());
	const [errorOpen, setErrorOpen] = useState(false);
	const [datasetId, setDatasetId] = useState();

	const [datasetRequestForm, setdatasetRequestForm] = useState("");
	const [metadataRequestForms, setMetadataRequestForms] = useState({});

	const history = useNavigate();

	useEffect(() => {
		if (reason !== "" && reason !== null && reason !== undefined) {
			setErrorOpen(true);
		}
	}, [reason])
	const handleErrorCancel = () => {
		// reset error message and close the error window
		dismissError();
		setErrorOpen(false);
	}
	const handleErrorReport = () => {
		window.open(`${config.GHIssueBaseURL}+${reason}&body=${encodeURIComponent(stack)}`);
	}

	// step 1
	const onDatasetSave = (formData:any) =>{
		setdatasetRequestForm(formData);
		handleNext();
	}
	// step 2
	const onMetadataSave = (contents:any) =>{
		setMetadataRequestForms(prevState => ({...prevState, [contents.definition]: contents}));
	}

	// step
	const [activeStep, setActiveStep] = useState(0);
	const handleNext = () => {
		setActiveStep((prevActiveStep) => prevActiveStep + 1);
	};
	const handleBack = () => {
		setActiveStep((prevActiveStep) => prevActiveStep - 1);
	}
	const handleFinish = () => {
		// create dataset
		createDataset(datasetRequestForm);
		// post new metadatas
		Object.keys(metadataRequestForms).map(key => {
			createDatasetMetadata(datasetId, metadataRequestForms[key]);
		})
		// redirect to the dataset page
	}

	// // zoom into that newly created dataset and reset newDataset
	// useEffect(() => {
	// 	if (newDataset !== undefined && newDataset.id !== undefined){
	// 		// history(`/datasets/${newDataset.id}`);
	// 		setDatasetId(newDataset.id);
	// 		dispatch(resetDatsetCreated());
	// 	}
	// }, [newDataset]);

	return (
		<>
			<TopBar/>
			<Box className="outer-container">
				{/*Error Message dialogue*/}
				<ActionModal actionOpen={errorOpen} actionTitle="Something went wrong..." actionText={reason}
							 actionBtnName="Report" handleActionBtnClick={handleErrorReport}
							 handleActionCancel={handleErrorCancel}/>
				<Box className="inner-container">
					<Box>
						<Stepper activeStep={activeStep} orientation="vertical">

							{/*step 1 Dataset*/}
							<Step key="create-dataset">
								<StepLabel>Create Dataset</StepLabel>
								<StepContent>
									<Typography>Create a dataset.</Typography>
									<Box>
										<CreateDatasetModal setDatasetId={setDatasetId} onSave={onDatasetSave}/>
									</Box>
								</StepContent>
							</Step>

							{/*step 2 Metadata*/}
							<Step key="fill-in-metadata">
								<StepLabel>Fill In Metadata</StepLabel>
								<StepContent>
									<Typography>Provide us your metadata about data.</Typography>
									<Box>
										<CreateMetadata saveMetadata={onMetadataSave}/>
									</Box>
									{/*buttons*/}
									<Box sx={{ mb: 2 }}>
										<>
											<Button variant="contained" onClick={handleFinish} sx={{ mt: 1, mr: 1 }}>
												Finish
											</Button>
											<Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>
												Back
											</Button>
										</>
									</Box>
								</StepContent>
							</Step>

							{/*/!* step 3 attach files *!/*/}
							{/*<Step key="attach-files">*/}
							{/*	<StepLabel*/}
							{/*		optional={<Typography variant="caption">Last step</Typography>}>*/}
							{/*		Attach Files*/}
							{/*	</StepLabel>*/}
							{/*	<StepContent>*/}
							{/*		<Typography>Upload files to the dataset.</Typography>*/}
							{/*		<Box>*/}
							{/*			<UploadFile />*/}
							{/*		</Box>*/}
							{/*		/!*buttons*!/*/}
							{/*		<Box sx={{ mb: 2 }}>*/}
							{/*			<>*/}
							{/*				<Button variant="contained" onClick={handleFinish} sx={{ mt: 1, mr: 1 }}>*/}
							{/*					Finish*/}
							{/*				</Button>*/}
							{/*				<Button onClick={handleBack} sx={{ mt: 1, mr: 1 }}>*/}
							{/*					Back*/}
							{/*				</Button>*/}
							{/*			</>*/}
							{/*		</Box>*/}
							{/*	</StepContent>*/}
							{/*</Step>*/}
						</Stepper>
					</Box>
				</Box>
			</Box>
		</>
	);
};
