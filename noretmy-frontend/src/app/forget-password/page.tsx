import ForgotPasswordScreen from '@/components/shared/ForgotPassword';
import { StoreProvider } from '@/store/StoreProvider';
const ForgetPassowrd = () => {
    return (
        <StoreProvider>
            <main className="overflow-x-hidden">

                <ForgotPasswordScreen />
            </main>
        </StoreProvider>
    );
};

export default ForgetPassowrd;
