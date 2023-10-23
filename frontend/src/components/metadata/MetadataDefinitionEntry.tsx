import React, { useEffect, useState } from "react";
import { Box, Button, Grid, Link } from "@mui/material";
import Layout from "../Layout";
import { useDispatch, useSelector } from "react-redux";
import Typography from "@mui/material/Typography";
import { useParams } from "react-router-dom";
import { MainBreadcrumbs } from "../navigation/BreadCrumb";
import { ErrorModal } from "../errors/ErrorModal";
import ReactJson from "react-json-view";
import { fetchMetadataDefinition as fetchMetadataDefinitionAction } from "../../actions/metadata";
import { RootState } from "../../types/data";
import DeleteMetadataDefinitionModal from "./DeleteMetadataDefinitionModal";
import DeleteIcon from "@mui/icons-material/Delete";

export function MetadataDefinitionEntry() {
	// path parameter
	const { metadataDefinitionId } = useParams<{
		metadataDefinitionId?: string;
	}>();

	// Redux connect equivalent
	const dispatch = useDispatch();
	const fetchMetadataDefinition = (metadataDefinitionId: string | undefined) =>
		dispatch(fetchMetadataDefinitionAction(metadataDefinitionId));
	const metadataDefinition = useSelector(
		(state: RootState) => state.metadata.metadataDefinition
	);

	const [
		deleteMetadataDefinitionConfirmOpen,
		setDeleteMetadataDefinitionConfirmOpen,
	] = useState(false);

	// component did mount
	useEffect(() => {
		fetchMetadataDefinition(metadataDefinitionId);
	}, []);

	// Error msg dialog
	const [errorOpen, setErrorOpen] = useState(false);

	// for breadcrumb
	const paths = [
		{
			name: "Metadata Definitions",
			url: "/metadata-definitions",
		},
		{
			name: metadataDefinition.name,
			url: `/metadata-definitions/${metadataDefinition.id}`,
		},
	];

	return (
		<Layout>
			{/*Error Message dialogue*/}
			<ErrorModal errorOpen={errorOpen} setErrorOpen={setErrorOpen} />
			{/*breadcrumb*/}
			<Grid container>
				<Grid item xs={10} sx={{ display: "flex", alignItems: "center" }}>
					<MainBreadcrumbs paths={paths} />
				</Grid>
			</Grid>
			<DeleteMetadataDefinitionModal
				deleteMetadataDefinitionConfirmOpen={
					deleteMetadataDefinitionConfirmOpen
				}
				setDeleteMetadataDefinitionConfirmOpen={
					setDeleteMetadataDefinitionConfirmOpen
				}
				metdataDefinitionId={metadataDefinition.id}
			/>
			{/*Header & menus*/}
			<Grid container>
				<Grid
					item
					xs={12}
					sm={12}
					md={8}
					lg={9}
					sx={{
						display: "flex",
						justifyContent: "flex-start",
						alignItems: "baseline",
					}}
				>
					<Box sx={{ display: "flex", flexDirection: "column" }}>
						<Box
							sx={{
								display: "flex",
								flexDirection: "flex-start",
								alignItems: "baseline",
							}}
						>
							<Typography variant="h3" paragraph>
								{metadataDefinition.name !== undefined
									? metadataDefinition.name
									: "Not found"}
							</Typography>
						</Box>
						<Typography variant="body1" paragraph>
							{metadataDefinition.description !== undefined
								? metadataDefinition.description
								: ""}
						</Typography>
						<Typography variant="body1" paragraph>
							<strong>Creator: </strong>
							{metadataDefinition.creator !== undefined &&
							metadataDefinition.creator.email !== undefined ? (
								<Link href={`mailto:${metadataDefinition.creator.email}`}>
									{metadataDefinition.creator.email}
								</Link>
							) : (
								<></>
							)}
						</Typography>
					</Box>
				</Grid>

				{/*Buttons*/}
				<Grid
					item
					xs={12}
					sm={12}
					md={4}
					lg={3}
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						alignItems: "baseline",
						flexDirection: "row",
					}}
				>
					<Button
						variant="contained"
						aria-label="delete"
						onClick={() => {
							setDeleteMetadataDefinitionConfirmOpen(true);
						}}
						endIcon={<DeleteIcon />}
						sx={{ float: "right" }}
					>
						Delete
					</Button>
				</Grid>
			</Grid>
			<ReactJson
				src={metadataDefinition}
				theme="summerfruit:inverted"
				displayObjectSize={false}
				displayDataTypes={false}
				name={false}
			/>
		</Layout>
	);
}
