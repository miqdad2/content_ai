import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LandingPage } from "@/pages/LandingPage";
import { VideoPage } from "@/pages/VideoPage";
import { ImagePage } from "@/pages/ImagePage";
import { FaceSwapPage } from "@/pages/FaceSwapPage";
import { LoginPage } from "@/pages/LoginPage";
import { AvatarPage } from "@/pages/AvatarPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { AdminTemplateCreatePage } from "@/pages/AdminTemplateCreatePage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/video" element={<VideoPage />} />
            <Route path="/image" element={<ImagePage />} />
            <Route path="/face-swap" element={<FaceSwapPage />} />
            <Route path="/user/templates" element={<TemplatesPage />} />
            <Route path="/user/avatar" element={<AvatarPage />} />
            <Route
              path="/admin/template/create"
              element={<AdminTemplateCreatePage />}
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
