export const metadata = {
  title: "Upload Your History — YouTube Wrapped",
  description: "Upload your Google Takeout YouTube watch history zip file to generate your Wrapped.",
};

import UploadClient from "./UploadClient";

export default function UploadPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        gap: "40px",
      }}
    >
      <UploadClient />
    </main>
  );
}
