import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
	Button,
	TableBody,
	TableRow,
	TableCell,
	IconButton,
	Table,
	TableHead,
	Paper,
	Tooltip,
	Typography,
	CircularProgress,
} from "@material-ui/core";
import {
	Edit,
	CheckCircle,
	SignalCellularConnectedNoInternet2Bar,
	SignalCellularConnectedNoInternet0Bar,
	SignalCellular4Bar,
	CropFree,
	DeleteOutline,
	Facebook,
	Instagram,
	WhatsApp,
} from "@material-ui/icons";

import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import usePlans from "../../hooks/usePlans";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";

const useStyles = makeStyles(theme => ({
	mainPaper: {
		flex: 1,
		padding: theme.spacing(1),
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},
	customTableCell: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	tooltip: {
		backgroundColor: "#f5f5f9",
		color: "rgba(0, 0, 0, 0.87)",
		fontSize: theme.typography.pxToRem(14),
		border: "1px solid #dadde9",
		maxWidth: 450,
	},
	tooltipPopper: {
		textAlign: "center",
	},
	buttonProgress: {
		color: green[500],
	},
}));

const CustomToolTip = ({ title, content, children }) => {
	const classes = useStyles();

	return (
		<Tooltip
			arrow
			classes={{
				tooltip: classes.tooltip,
				popper: classes.tooltipPopper,
			}}
			title={
				<React.Fragment>
					<Typography gutterBottom color="inherit">
						{title}
					</Typography>
					{content && <Typography>{content}</Typography>}
				</React.Fragment>
			}
		>
			{children}
		</Tooltip>
	);
};

const IconChannel = (channel) => {
	switch (channel) {
		case "facebook":
			return <Facebook style={{ color: "#3b5998" }} />;
		case "instagram":
			return <Instagram style={{ color: "#e1306c" }} />;
		case "whatsapp":
			return <WhatsApp style={{ color: "#25d366" }} />;
		default:
			return "error";
	}
};

const Connections = () => {
	const classes = useStyles();

	const { user } = useContext(AuthContext);
	const { whatsApps, loading } = useContext(WhatsAppsContext);
	const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
	const [qrModalOpen, setQrModalOpen] = useState(false);
	const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const confirmationModalInitialState = {
		action: "",
		title: "",
		message: "",
		whatsAppId: "",
		open: false,
	};
	const [confirmModalInfo, setConfirmModalInfo] = useState(
		confirmationModalInitialState
	);

	const [planConfig, setPlanConfig] = useState(false);

	const { getPlanCompany } = usePlans();

	useEffect(() => {
		async function fetchData() {
			const companyId = localStorage.getItem("companyId");
			const planConfigs = await getPlanCompany(undefined, companyId);
			setPlanConfig(planConfigs)
		}
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const responseFacebook = (response) => {
		if (response.status !== "unknown") {
			const { accessToken, id } = response;

			api
				.post("/facebook", {
					facebookUserId: id,
					facebookUserToken: accessToken,
				})
				.then((response) => {
					toast.success(i18n.t("connections.facebook.success"));
				})
				.catch((error) => {
					toastError(error);
				});
		}
	};

	const responseInstagram = (response) => {
		if (response.status !== "unknown") {
			const { accessToken, id } = response;

			api
				.post("/instagram", {
					addInstagram: true,
					facebookUserId: id,
					facebookUserToken: accessToken,
				})
				.then((response) => {
					toast.success(i18n.t("connections.facebook.success"));
				})
				.catch((error) => {
					toastError(error);
				});
		}
	};

	const handleStartWhatsAppSession = async whatsAppId => {
		try {
			await api.post(`/whatsappsession/${whatsAppId}`);
		} catch (err) {
			toastError(err);
		}
	};

	const handleRequestNewQrCode = async whatsAppId => {
		try {
			await api.put(`/whatsappsession/${whatsAppId}`);
		} catch (err) {
			toastError(err);
		}
	};

	const handleOpenWhatsAppModal = () => {
		setSelectedWhatsApp(null);
		setWhatsAppModalOpen(true);
	};

	const handleCloseWhatsAppModal = useCallback(() => {
		setWhatsAppModalOpen(false);
		setSelectedWhatsApp(null);
	}, [setSelectedWhatsApp, setWhatsAppModalOpen]);

	const handleOpenQrModal = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setQrModalOpen(true);
	};

	const handleCloseQrModal = useCallback(() => {
		setSelectedWhatsApp(null);
		setQrModalOpen(false);
	}, [setQrModalOpen, setSelectedWhatsApp]);

	const handleEditWhatsApp = whatsApp => {
		setSelectedWhatsApp(whatsApp);
		setWhatsAppModalOpen(true);
	};

	const handleOpenConfirmationModal = (action, whatsAppId) => {
		if (action === "disconnect") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.disconnectTitle"),
				message: i18n.t("connections.confirmationModal.disconnectMessage"),
				whatsAppId: whatsAppId,
			});
		}

		if (action === "delete") {
			setConfirmModalInfo({
				action: action,
				title: i18n.t("connections.confirmationModal.deleteTitle"),
				message: i18n.t("connections.confirmationModal.deleteMessage"),
				whatsAppId: whatsAppId,
			});
		}
		setConfirmModalOpen(true);
	};

	const handleSubmitConfirmationModal = async () => {
		if (confirmModalInfo.action === "disconnect") {
			try {
				await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
			} catch (err) {
				toastError(err);
			}
		}

		if (confirmModalInfo.action === "delete") {
			try {
				await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
				toast.success(i18n.t("connections.toasts.deleted"));
			} catch (err) {
				toastError(err);
			}
		}

		setConfirmModalInfo(confirmationModalInitialState);
	};

	const renderActionButtons = whatsApp => {
		return (
			<>
				{whatsApp.channel === "whatsapp" ? (
					<>
						{whatsApp.status === "qrcode" && (
							<Button
								size="small"
								variant="contained"
								color="primary"
								onClick={() => handleOpenQrModal(whatsApp)}
							>
								{i18n.t("connections.buttons.qrcode")}
							</Button>
						)}
						{whatsApp.status === "DISCONNECTED" && (
							<>
								<Button
									size="small"
									variant="outlined"
									color="primary"
									onClick={() => handleStartWhatsAppSession(whatsApp.id)}
								>
									{i18n.t("connections.buttons.tryAgain")}
								</Button>{" "}
								<Button
									size="small"
									variant="outlined"
									color="secondary"
									onClick={() => handleRequestNewQrCode(whatsApp.id)}
								>
									{i18n.t("connections.buttons.newQr")}
								</Button>
							</>
						)}
						{(whatsApp.status === "CONNECTED" ||
							whatsApp.status === "PAIRING" ||
							whatsApp.status === "TIMEOUT") && (
								<Button
									size="small"
									variant="outlined"
									color="secondary"
									onClick={() => {
										handleOpenConfirmationModal("disconnect", whatsApp.id);
									}}
								>
									{i18n.t("connections.buttons.disconnect")}
								</Button>
							)}
						{whatsApp.status === "OPENING" && (
							<Button size="small" variant="outlined" disabled color="default">
								{i18n.t("connections.buttons.connecting")}
							</Button>
						)}
					</>
				) : (
					<>
						{whatsApp.facebookUserId != null ? (
							<Button
								size="small"
								variant="outlined"
								color="secondary"
							>
								{i18n.t("CONECTADO")}
							</Button>
						) : (
							<Button size="small" variant="contained" color="secondary">
								{i18n.t("connections.buttons.alternative")}
							</Button>
						)}
					</>
				)}
			</>
		);
	};



	const renderStatusToolTips = whatsApp => {
		return (
			<div className={classes.customTableCell}>
				{whatsApp.channel === "whatsapp" ? (
					<>
						{whatsApp.status === "DISCONNECTED" && (
							<CustomToolTip
								title={i18n.t("connections.toolTips.disconnected.title")}
								content={i18n.t("connections.toolTips.disconnected.content")}
							>
								<SignalCellularConnectedNoInternet0Bar color="secondary" />
							</CustomToolTip>
						)}
						{whatsApp.status === "OPENING" && (
							<CircularProgress size={24} className={classes.buttonProgress} />
						)}
						{whatsApp.status === "qrcode" && (
							<CustomToolTip
								title={i18n.t("connections.toolTips.qrcode.title")}
								content={i18n.t("connections.toolTips.qrcode.content")}
							>
								<CropFree />
							</CustomToolTip>
						)}
						{whatsApp.status === "CONNECTED" && (
							<CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
								<SignalCellular4Bar style={{ color: green[500] }} />
							</CustomToolTip>
						)}
						{(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
							<CustomToolTip
								title={i18n.t("connections.toolTips.timeout.title")}
								content={i18n.t("connections.toolTips.timeout.content")}
							>
								<SignalCellularConnectedNoInternet2Bar color="secondary" />
							</CustomToolTip>
						)}
					</>
				) : (
					<>
						{whatsApp.facebookUserId != null && (
							<CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
								<SignalCellular4Bar style={{ color: green[500] }} />
							</CustomToolTip>
						)}
					</>
				)}
			</div>
		);
	};


	const restartWhatsapps = async () => {
		// const companyId = localStorage.getItem("companyId");
		try {
			await api.post(`/whatsapp-restart/`);
			toast.success(i18n.t("Aguarde... Suas conexões serão reiniciadas!"));
		} catch (err) {
			toastError(err);
		}
	}

	const openInNewTab = url => {
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<MainContainer>
			<ConfirmationModal
				title={confirmModalInfo.title}
				open={confirmModalOpen}
				onClose={setConfirmModalOpen}
				onConfirm={handleSubmitConfirmationModal}
			>
				{confirmModalInfo.message}
			</ConfirmationModal>
			<QrcodeModal
				open={qrModalOpen}
				onClose={handleCloseQrModal}
				whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
			/>
			<WhatsAppModal
				open={whatsAppModalOpen}
				onClose={handleCloseWhatsAppModal}
				whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
			/>
			<MainHeader>
				<Title>{i18n.t("connections.title")}</Title>
				<MainHeaderButtonsWrapper>
					<Button
						variant="contained"
						color="primary"
						onClick={restartWhatsapps}
					>
						{i18n.t("REINICIAR CONEXÕES")}
					</Button>

					<Button
						variant="contained"
						color="primary"
						onClick={() => openInNewTab(`https://wa.me/${process.env.REACT_APP_NUMBER_SUPPORT}`)}
					>
						{i18n.t("CHAMAR NO SUPORTE")}
					</Button>
					<PopupState variant="popover" popupId="demo-popup-menu">
						{(popupState) => (
							<React.Fragment>
								<Button
									variant="contained"
									color="primary"
									{...bindTrigger(popupState)}
								>
									Nova Conexão
								</Button>
								<Menu {...bindMenu(popupState)}>
									{/* WHATSAPP */}
									<MenuItem
										//disabled={planConfig?.plan?.useWhatsapp ? false : true}
										onClick={() => {
											handleOpenWhatsAppModal();
											popupState.close();
										}}
									>
										<WhatsApp
											fontSize="small"
											style={{
												marginRight: "10px",
												color: "#25D366",
											}}
										/>
										WhatsApp
									</MenuItem>
									{/* FACEBOOK */}
									<FacebookLogin
										appId={process.env.REACT_APP_FACEBOOK_APP_ID}
										autoLoad={false}
										fields="name,email,picture"
										version="18.0"
										scope="public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
										//scope="pages_show_list,pages_manage_metadata,pages_messaging,pages_messaging_subscriptions,business_management,pages_read_engagement"
										callback={responseFacebook}
										render={(renderProps) => (
											<MenuItem
												disabled={planConfig?.plan?.useFacebook ? false : true}
												onClick={renderProps.onClick}
											>
												<Facebook
													fontSize="small"
													style={{
														marginRight: "10px",
														color: "#3b5998",
													}}
												/>
												Facebook
											</MenuItem>
										)}
									/>
									{/* INSTAGRAM */}
									<FacebookLogin
										appId={process.env.REACT_APP_FACEBOOK_APP_ID}
										autoLoad={false}
										fields="name,email,picture"
										version="18.0"
										//scope="pages_show_list,pages_manage_metadata,pages_messaging,pages_messaging_subscriptions,business_management,pages_read_engagement"
										scope="public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
										callback={responseInstagram}
										render={(renderProps) => (
											<MenuItem
												disabled={planConfig?.plan?.useInstagram ? false : true}
												onClick={renderProps.onClick}
											>
												<Instagram
													fontSize="small"
													style={{
														marginRight: "10px",
														color: "#e1306c",
													}}
												/>
												Instagram
											</MenuItem>
										)}
									/>

								</Menu>
							</React.Fragment>
						)}
					</PopupState>
				</MainHeaderButtonsWrapper>
			</MainHeader>
			<Paper className={classes.mainPaper} variant="outlined">
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell align="center">Channel</TableCell>
							<TableCell align="center">{i18n.t("connections.table.name")}</TableCell>
							<TableCell align="center">{i18n.t("connections.table.status")}</TableCell>
							<Can
								role={user.profile}
								perform="connections-page:actionButtons"
								yes={() => (
									<TableCell align="center">
										{i18n.t("connections.table.session")}
									</TableCell>
								)}
							/>
							<TableCell align="center">
								{i18n.t("connections.table.lastUpdate")}
							</TableCell>
							<TableCell align="center">
								{i18n.t("connections.table.default")}
							</TableCell>
							<Can
								role={user.profile}
								perform="connections-page:editOrDeleteConnection"
								yes={() => (
									<TableCell align="center">
										{i18n.t("connections.table.actions")}
									</TableCell>
								)}
							/>
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRowSkeleton />
						) : (
							<>
								{whatsApps?.length > 0 &&
									whatsApps.map(whatsApp => (
										<TableRow key={whatsApp.id}>
											<TableCell align="center">{IconChannel(whatsApp.channel)}</TableCell>
											<TableCell align="center">{whatsApp.name}</TableCell>
											<TableCell align="center">
												{renderStatusToolTips(whatsApp)}
											</TableCell>
											<Can
												role={user.profile}
												perform="connections-page:actionButtons"
												yes={() => (
													<TableCell align="center">
														{renderActionButtons(whatsApp)}
													</TableCell>
												)}
											/>
											<TableCell align="center">
												{format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
											</TableCell>
											<TableCell align="center">
												{whatsApp.isDefault && (
													<div className={classes.customTableCell}>
														<CheckCircle style={{ color: green[500] }} />
													</div>
												)}
											</TableCell>
											<Can
												role={user.profile}
												perform="connections-page:editOrDeleteConnection"
												yes={() => (
													<TableCell align="center">
														<IconButton
															size="small"
															onClick={() => handleEditWhatsApp(whatsApp)}
														>
															<Edit />
														</IconButton>

														<IconButton
															size="small"
															onClick={e => {
																handleOpenConfirmationModal("delete", whatsApp.id);
															}}
														>
															<DeleteOutline />
														</IconButton>
													</TableCell>
												)}
											/>
										</TableRow>
									))}
							</>
						)}
					</TableBody>
				</Table>
			</Paper>
		</MainContainer>
	);
};

export default Connections;
