import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const API_URL =
  `${import.meta.env.VITE_API_URL}/auth/google`;

export default function GoogleLoginButton() {
  const navigate = useNavigate();

  const { login } = useAuth();

  async function handleSuccess(
    credentialResponse: any
  ) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
      });

      if (!response.ok) {
        throw new Error("Google login failed.");
      }

      const result = await response.json();

      login(result.user, result.token);

      navigate("/");

    } catch (error) {
      console.error(error);
    }
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() =>
        console.log("Google Login Failed")
      }
      useOneTap={false}
    />
  );
}


