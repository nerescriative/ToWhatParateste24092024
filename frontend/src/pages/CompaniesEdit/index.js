import React, { useState, useEffect, useReducer } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CompanyModal from "../../components/CompanyModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { socketConnection } from "../../services/socket";

const reducer = (state, action) => {
  if (action.type === "LOAD_COMPANIES") {
    const companies = action.payload;
    const newCompanies = [];

    companies.forEach((company) => {
      const companyIndex = state.findIndex((u) => u.id === company.id);
      if (companyIndex !== -1) {
        state[companyIndex] = company;
      } else {
        newCompanies.push(company);
      }
    });

    return [...state, ...newCompanies];
  }

  if (action.type === "UPDATE_USERS") {
    const company = action.payload;
    const companyIndex = state.findIndex((u) => u.id === company.id);

    if (companyIndex !== -1) {
      state[companyIndex] = company;
      return [...state];
    } else {
      return [company, ...state];
    }
  }

  if (action.type === "DELETE_USER") {
    const companyId = action.payload;

    const companyIndex = state.findIndex((u) => u.id === companyId);
    if (companyIndex !== -1) {
      state.splice(companyIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const Companies = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [companies, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchCompanies = async () => {
        try {
          const { data } = await api.get("/companies/", {
            params: { searchParam, pageNumber },
          });
          console.log({dataCompany:data})
          dispatch({ type: "LOAD_COMPANIES", payload: data.companies });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchCompanies();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  // useEffect(() => {
  //   // const companyId = localStorage.getItem("companyId");
  //   // const socket = socketConnection({ companyId });

  //   // socket.on(`company-${companyId}-company`, (data) => {
  //   //   if (data.action === "update" || data.action === "create") {
  //   //     dispatch({ type: "UPDATE_USERS", payload: data.company });
  //   //   }

  //   //   if (data.action === "delete") {
  //   //     dispatch({ type: "DELETE_USER", payload: +data.companyId });
  //   //   }
  //   // });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  const handleOpenCompanyModal = () => {
    setSelectedCompany(null);
    setCompanyModalOpen(true);
  };

  const handleCloseCompanyModal = () => {
    setSelectedCompany(null);
    setCompanyModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setCompanyModalOpen(true);
  };

  const handleDeleteUser = async (companyId) => {
    try {
      // await api.delete(`/companies/${companyId}`);
      // toast.success(i18n.t("companies.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingCompany(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingCompany &&
          `${i18n.t("users.confirmationModal.deleteTitle")} ${
            deletingCompany.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteUser(deletingCompany.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <CompanyModal
        open={companyModalOpen}
        onClose={handleCloseCompanyModal}
        aria-labelledby="form-dialog-title"
        companyId={selectedCompany && selectedCompany.id}
      />
      <MainHeader>
        <Title>Empresas</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenCompanyModal}
          >
            Adicionar Empresa
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">{i18n.t("users.table.name")}</TableCell>
              <TableCell align="center">
                {i18n.t("users.table.email")}
              </TableCell>
              {/* <TableCell align="center">
                {i18n.t("companies.table.profile")}
              </TableCell> */}
              <TableCell align="center">
                {i18n.t("users.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell align="center">{company.name}</TableCell>
                  <TableCell align="center">{company.email}</TableCell>
                  {/* <TableCell align="center">{company.profile}</TableCell> */}
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditCompany(company)}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setConfirmModalOpen(true);
                        setDeletingCompany(company);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Companies;
