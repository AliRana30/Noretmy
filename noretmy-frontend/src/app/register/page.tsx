// import DiveDeeper from '@/components/shared/DiveDeeper';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RegisterPage from '@/components/shared/register';
const Register = () => {
  return (
    <main className="overflow-x-hidden">
      {/* <DiveDeeper></DiveDeeper> */}
      <ToastContainer />
      <RegisterPage />
    </main>
  );
};

export default Register;
