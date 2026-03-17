"use client";

import { Download, Upload } from "lucide-react";
import { styled } from "next-yak";
import { useRef } from "react";
import { Button } from "@/components/Button";
import {
  exportEnergyPlannerData,
  importEnergyPlannerData,
} from "./ImportExport.utils";

const handleFileImportError = (error: Error | unknown) => {
  alert(
    error instanceof Error
      ? error.message
      : "Failed to import data. Please check the file format.",
  );
};

export const ImportExport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportEnergyPlannerData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importEnergyPlannerData(file);
    } catch (error) {
      handleFileImportError(error);
    }
  };

  return (
    <ButtonGroup>
      <Button
        intent="secondary"
        leftIcon={<Download size={18} />}
        onClick={handleExport}
        title="Export data"
        variant="outline"
      >
        Export
      </Button>
      <Button
        intent="secondary"
        leftIcon={<Upload size={18} />}
        onClick={handleImportClick}
        title="Import data"
        variant="outline"
      >
        Import
      </Button>
      <input
        accept=".json"
        onChange={handleImportFile}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />
    </ButtonGroup>
  );
};

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;
