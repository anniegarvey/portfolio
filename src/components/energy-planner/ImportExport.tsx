"use client";

import { Download, Upload } from "lucide-react";
import { styled } from "next-yak";
import { useRef } from "react";
import {
  exportEnergyPlannerData,
  importEnergyPlannerData,
} from "@/lib/energy-planner/utils";

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
      <ActionButton onClick={handleExport} title="Export data">
        <Download size={18} />
        Export
      </ActionButton>
      <ActionButton onClick={handleImportClick} title="Import data">
        <Upload size={18} />
        Import
      </ActionButton>
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

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-900);
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
      background-color: var(--color-neutral-300);
      border-color: var(--color-neutral-400);
  }
`;
