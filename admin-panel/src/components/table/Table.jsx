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

const titleCase = (value = "") => {
  if (!value) return "N/A";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const List = ({ jobsData = [], variant = "jobs" }) => {
  const { getTranslation } = useLocalization();
  const isOrdersVariant = variant === "orders";

  const headers = isOrdersVariant
    ? ["Order ID", "Service", "Seller", "Amount", "Status"]
    : [
        getTranslation(tableTranslations, "gigId"),
        "Service",
        getTranslation(tableTranslations, "dateCreated"),
        getTranslation(tableTranslations, "upgradeMethod"),
        getTranslation(tableTranslations, "status"),
      ];

  const getStatusClass = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();
    if (["approved", "active", "completed", "paid", "accepted"].includes(normalizedStatus)) {
      return "bg-green-50 text-green-700";
    }
    if (["pending", "in progress", "in_progress", "processing", "started"].includes(normalizedStatus)) {
      return "bg-amber-50 text-amber-700";
    }
    if (["inactive", "cancelled", "rejected", "failed", "disputed"].includes(normalizedStatus)) {
      return "bg-red-50 text-red-700";
    }
    return "bg-slate-100 text-slate-700";
  };
  
  return (
    <TableContainer component={Paper} className="table">
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header} className="tableCell">{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {jobsData.map((row) => (
            <TableRow key={row.id}>
              {isOrdersVariant ? (
                <>
                  <TableCell className="tableCell">{row.orderId || row.id}</TableCell>
                  <TableCell className="tableCell">{row.serviceTitle || "Order"}</TableCell>
                  <TableCell className="tableCell">{row.sellerName || "N/A"}</TableCell>
                  <TableCell className="tableCell">${Number(row.amount || 0).toFixed(2)}</TableCell>
                  <TableCell className="tableCell">
                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium", getStatusClass(row.status))}>
                      {titleCase(row.status)}
                    </span>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="tableCell">{row.serviceId || row.id}</TableCell>
                  <TableCell className="tableCell">{row.serviceTitle || "N/A"}</TableCell>
                  <TableCell className="tableCell">{row.date || "N/A"}</TableCell>
                  <TableCell className="tableCell">{row.upgradeMethod || "Free"}</TableCell>
                  <TableCell className="tableCell">
                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium", getStatusClass(row.status))}>
                      {titleCase(row.status)}
                    </span>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default List;
