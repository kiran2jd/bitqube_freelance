import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { HomePage } from "../pages/HomePage";
import { CategoriesPage } from "../pages/CategoriesPage";
import { HowItWorksPage } from "../pages/HowItWorksPage";
import { AboutPage } from "../pages/AboutPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { FindProfessionalsPage } from "../pages/FindProfessionalsPage";
import { ProfessionalDetailPage } from "../pages/ProfessionalDetailPage";
import { CustomerDashboardPage } from "../pages/CustomerDashboardPage";
import { ProfessionalDashboardPage } from "../pages/ProfessionalDashboardPage";
import { ProfessionalProfileEditPage } from "../pages/ProfessionalProfileEditPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { BrowseProjectsPage } from "../pages/BrowseProjectsPage";
import { PostProjectPage } from "../pages/PostProjectPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ContractsListPage } from "../pages/ContractsListPage";
import { ContractDetailPage } from "../pages/ContractDetailPage";
import { ProtectedRoute } from "../components/ProtectedRoute";

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/professionals" element={<FindProfessionalsPage />} />
            <Route path="/professionals/:id" element={<ProfessionalDetailPage />} />
            <Route path="/projects" element={<BrowseProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />

            {/* Project creation (Customer or Admin) */}
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute allowedRoles={["customer", "administrator"]}>
                  <PostProjectPage />
                </ProtectedRoute>
              }
            />

            {/* Contracts management */}
            <Route
              path="/contracts"
              element={
                <ProtectedRoute allowedRoles={["customer", "professional", "administrator"]}>
                  <ContractsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute allowedRoles={["customer", "professional", "administrator"]}>
                  <ContractDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Customer dashboard */}
            <Route
              path="/dashboard/customer"
              element={
                <ProtectedRoute allowedRoles={["customer", "administrator"]}>
                  <CustomerDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Professional dashboard & profile */}
            <Route
              path="/dashboard/professional"
              element={
                <ProtectedRoute allowedRoles={["professional", "administrator"]}>
                  <ProfessionalDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/professional/profile/edit"
              element={
                <ProtectedRoute allowedRoles={["professional", "administrator"]}>
                  <ProfessionalProfileEditPage />
                </ProtectedRoute>
              }
            />

            {/* Administrator Operations Command Center */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["administrator"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};
