import LoginPage from '@/components/shared/login';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  return (
    <>
      <Head>
        <title>Login - noretmy.com</title>
        <meta
          name="description"
          content="Log in to noretmy.com and connect with top freelancers or post job opportunities without upfront charges or hidden fees."
        />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://noretmy.com/login" />
      </Head>

      <main className="overflow-x-hidden">
        <LoginPage />
        <ToastContainer />
      </main>
    </>
  );
};

export default Login;
