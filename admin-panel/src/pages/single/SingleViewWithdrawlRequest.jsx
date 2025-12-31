import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

const ViewWithdrawalRequest = () => {
  const { requestId } = useParams(); // Retrieve requestId from the route params
  const [requestData, setRequestData] = useState({});

  useEffect(() => {
    // Dummy data to simulate API response
    const dummyData = {
      requestId: requestId || "WR001",
      amount: 150.0,
      withdrawalMethod: "PayPal",
      paypalEmail: "john.doe@paypal.com",
      user: {
        username: "John Doe",
        email: "john.doe@example.com",
      },
      orders: [
        { orderId: "O123", amount: 100.0, completedOn: "2024-12-18" },
        { orderId: "O124", amount: 50.0, completedOn: "2024-12-19" },
      ],
    };

    // Simulate API call with dummy data
    setRequestData(dummyData);
  }, [requestId]);

  const user = requestData.user || {}; // Nested user data

  return (
    <div className="single">
      <div className="singleContainer">
        <div className="top">
          <div className="left">
            <h1 className="title">Withdrawal Request Details</h1>
            <div className="item">
              <div className="details">
                <h1 className="itemTitle">Request Information</h1>
                <div className="detailItem">
                  <span className="itemKey">Request ID:</span>
                  <span className="itemValue">{requestData.requestId || "N/A"}</span>
                </div>
                <div className="detailItem">
                  <span className="itemKey">User:</span>
                  <span className="itemValue">{user.username || "N/A"}</span>
                </div>
                <div className="detailItem">
                  <span className="itemKey">Email:</span>
                  <span className="itemValue">{user.email || "N/A"}</span>
                </div>
                <div className="detailItem">
                  <span className="itemKey">Requested Amount:</span>
                  <span className="itemValue">${requestData.amount?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="detailItem">
                  <span className="itemKey">Withdrawal Method:</span>
                  <span className="itemValue">{requestData.withdrawalMethod || "N/A"}</span>
                </div>
                {requestData.withdrawalMethod === "PayPal" && (
                  <div className="detailItem">
                    <span className="itemKey">PayPal Email:</span>
                    <span className="itemValue">{requestData.paypalEmail || "N/A"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bottom">
          <h1 className="title">Associated Orders</h1>
          {requestData.orders?.length > 0 ? (
            <table className="ordersTable">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Completed On</th>
                </tr>
              </thead>
              <tbody>
                {requestData.orders.map((order) => (
                  <tr key={order.orderId}>
                    <td>{order.orderId}</td>
                    <td>${order.amount?.toFixed(2)}</td>
                    <td>{new Date(order.completedOn).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No associated orders available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewWithdrawalRequest;
