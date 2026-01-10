import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import List from "./pages/list/List";
import Single from "./pages/single/Single";
import New from "./pages/new/New";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { productInputs, userInputs } from "./formSource";
import { useContext } from "react";
import { DarkModeContext } from "./context/darkModeContext.jsx";
import { LocalizationProvider } from "./context/LocalizationContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import SingleOrder from "./pages/single/SingleOrder";
import ListOrders from "./pages/list/ListOrders";
import ListJobs from "./pages/list/ListJobs";
import ListSensitive from "./pages/list/ListSensitive";
import ListMessages from "./pages/list/ListMessages";
import ReplyEmail from "./pages/single/Reply";
import ManageContent from "./pages/manageContent/ManageContent";
import ListFaqs from "./pages/list/ListFaqs";
import ListPrivacy from "./pages/list/ListPrivacy";
import AddNewFaq from "./pages/single/AddNewFaq";
import ListDocuments from "./pages/list/ListDocuments";
import ListWithdrawlRequests from "./pages/list/ListWithdrawlRequests";
import ViewWithdrawalRequest from "./pages/single/SingleViewWithdrawlRequest";
import Layout from "./components/common/Layout";
import { Toaster } from "react-hot-toast";

// Admin Components
import AdminUsersList from "./pages/admin/AdminUsersList";

// New Pages
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";
import SystemHealth from "./pages/system/SystemHealth";
import Logs from "./pages/system/Logs";

function App() {
  const { darkMode } = useContext(DarkModeContext);

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Toaster 
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#1a1a2e' : '#fff',
            color: darkMode ? '#fff' : '#1a1a2e',
            border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
          zIndex: 99999, // Added zIndex to toastOptions
        }}
      />
      <AuthProvider>
        <NotificationProvider>
          <LocalizationProvider>
            <BrowserRouter>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Home />} />

                {/* Profile & Settings */}
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="system-health" element={<SystemHealth />} />
                <Route path="logs" element={<Logs />} />

                {/* Admin Routes - Protected with AdminRoute */}
                <Route path="admin">
                  <Route path="users" element={<AdminRoute requiredPermissions={['user_management']}><AdminUsersList /></AdminRoute>} />
                  <Route path="users/:userId" element={<AdminRoute requiredPermissions={['user_management']}><Single /></AdminRoute>} />
                  <Route path="orders" element={<AdminRoute requiredPermissions={['order_management']}><ListOrders /></AdminRoute>} />
                  <Route path="orders/:orderId" element={<AdminRoute requiredPermissions={['order_management']}><SingleOrder /></AdminRoute>} />
                  <Route path="jobs" element={<AdminRoute requiredPermissions={['content_moderation']}><ListJobs /></AdminRoute>} />
                  <Route path="sensitive-messages" element={<AdminRoute requiredPermissions={['content_moderation']}><ListSensitive /></AdminRoute>} />
                  <Route path="contacts" element={<AdminRoute requiredPermissions={['content_moderation']}><ListMessages /></AdminRoute>} />
                  <Route path="contacts/reply" element={<AdminRoute requiredPermissions={['content_moderation']}><ReplyEmail /></AdminRoute>} />
                  <Route path="content" element={<AdminRoute requiredPermissions={['content_moderation']}><ManageContent /></AdminRoute>} />
                  <Route path="content/faqs" element={<AdminRoute requiredPermissions={['content_moderation']}><ListFaqs /></AdminRoute>} />
                  <Route path="content/privacy" element={<AdminRoute requiredPermissions={['content_moderation']}><ListPrivacy /></AdminRoute>} />
                  <Route path="documents" element={<AdminRoute requiredPermissions={['user_management']}><ListDocuments /></AdminRoute>} />
                  <Route path="withdrawals" element={<AdminRoute requiredPermissions={['payment_management']}><ListWithdrawlRequests /></AdminRoute>} />
                  <Route path="withdrawals/:withdrawalId" element={<AdminRoute requiredPermissions={['payment_management']}><ViewWithdrawalRequest /></AdminRoute>} />
                </Route>

                {/* Regular User Routes */}
                <Route path="users">
                  <Route index element={<List />} />
                  <Route path=":userId" element={<Single />} />
                  <Route
                    path="new"
                    element={<New inputs={userInputs} title="Add New User" apiEndpoint="/api/auth/signup" />}
                  />
                </Route>

                <Route path="products">
                  <Route index element={<ListOrders />} />
                  <Route path=":productId" element={<SingleOrder />} />
                  <Route
                    path="new"
                    element={<New inputs={productInputs} title="Add New Product" />}
                  />
                </Route>

                <Route path="orders">
                  <Route index element={<ListJobs />} />
                  <Route path=":productId" element={<SingleOrder />} />
                  <Route
                    path="new"
                    element={<New inputs={productInputs} title="Add New Product" />}
                  />
                </Route>

                <Route path="sensitive">
                  <Route index element={<ListSensitive />} />
                  <Route path=":productId" element={<SingleOrder />} />
                  <Route
                    path="new"
                    element={<New inputs={productInputs} title="Add New Product" />}
                  />
                </Route>

                {/* FAQ Routes */}
                <Route path="faqs">
                  <Route index element={<AddNewFaq />} />
                </Route>

                <Route path="notifications">
                  <Route index element={<ListMessages />} />
                  <Route path="reply" element={<ReplyEmail />} />
                </Route>

                <Route path="content">
                  <Route index element={<ManageContent />} />
                  <Route path="faqs" element={<ListFaqs/>} >
                    <Route path="addnewfaq" element={<AddNewFaq/>}/>
                  </Route>
                  <Route path="privacy" element={<ListPrivacy/>} />
                </Route>

                <Route path="document-verify">
                  <Route index element={<ListDocuments/>} />
                  <Route path=":userId" element={<Single />} />
                  <Route
                    path="new"
                    element={<New inputs={userInputs} title="Add New User" />}
                  />
                </Route>

              </Route>
          </Routes>
          </BrowserRouter>
        </LocalizationProvider>
      </NotificationProvider>
    </AuthProvider>
    </div>
  );
}

export default App;
