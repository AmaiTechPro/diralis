import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { googleLogin } from "../../api/googleAuth";

export default function GoogleLoginButton() {
  const navigate = useNavigate();

  const { login } = useAuth();

  async function handleSuccess(
    credentialResponse: any
  ) {
    try {
      if (!credentialResponse.credential) {
        throw new Error("Google did not return a credential.");
      }

      const result = await googleLogin(
        credentialResponse.credential
      );

      login(result.user, result.token);

      navigate("/");
    } catch (error) {
      console.error("Google Login Error:", error);
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.error("Google Login Failed");
      }}
      useOneTap={false}
    />
  );
}



