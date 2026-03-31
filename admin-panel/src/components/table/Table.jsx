import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import tableTranslations from "../../localization/table.json";
import { cn } from "#/lib/utils";

const List = ({jobsData}) => {
  const { getTranslation } = useLocalization();
  
  return (
    <TableContainer component={Paper} className="table">
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell className="tableCell">{getTranslation(tableTranslations, "gigId")}</TableCell>
            <TableCell className="tableCell">{getTranslation(tableTranslations, "jobStatus")}</TableCell>
            <TableCell className="tableCell">{getTranslation(tableTranslations, "dateCreated")}</TableCell>
            <TableCell className="tableCell">{getTranslation(tableTranslations, "upgradeMethod")}</TableCell>
            <TableCell className="tableCell">{getTranslation(tableTranslations, "status")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobsData.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="tableCell">{row.id}</TableCell>
              <TableCell className="tableCell">{row.jobStatus}</TableCell>
              <TableCell className="tableCell">{row.date}</TableCell>
              <TableCell className="tableCell">{row.upgradeOption}</TableCell>
              <TableCell className="tableCell">
                <span className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium",
                  row.status === 'Approved' || row.status === 'Active'
                    ? "bg-green-50 text-green-700" 
                    : row.status === 'Pending' || row.status === 'In Progress'
                    ? "bg-amber-50 text-amber-700"
                    : row.status === 'Inactive'
                    ? "bg-slate-100 text-slate-700"
                    : "bg-red-50 text-red-700"
                )}>{row.status}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default List;
