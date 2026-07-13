import AuthForm from "./AuthForm";

export const metadata = {
  title: "Sign In — YouTube Wrapped",
  description: "Sign in with your Google account to get your personalized YouTube Wrapped.",
};

export default function AuthPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <AuthForm />
    </main>
  );
}
