import React, { useState } from "react";
import NetworkAlert from "@/components/AccountAlert";
import Navbar from "@/components/Navbar";
import "./App.css";
import Alert from "./components/Alert";
import { StoryProvider } from "./context/StoryContext";
import { MetaMaskProvider } from "./hooks/MetamaskContext";
import "./styles/global.css";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import TokenPriceFetcher from "./components/TokenPriceFetcher";
import FormComponent from "./components/FormComponent";

function App() {
  return (
    <>
      <MetaMaskProvider>
        <StoryProvider>
          <div className="min-h-screen flex flex-col">
            <div className="sticky top-0 w-full gradient-bg-welcome">
              <Navbar />
              <Alert />
              <NetworkAlert />
            </div>
            <div className="flex-grow flex items-center justify-center">
              <TokenPriceFetcher />
            </div>
            <FormComponent></FormComponent>
          </div>
        </StoryProvider>
      </MetaMaskProvider>
    </>
  );
}

export default App;
