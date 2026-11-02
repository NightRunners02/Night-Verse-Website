import React from "react";
import { useAppState } from "../context/AppState.js";
import { FullProfileView } from "./FullProfileView.js";

export interface ProfileOverviewProps {
  onEditClick?: () => void;
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({ onEditClick }) => {
  const { user, targetUserId, navigateTo } = useAppState();

  const activeTargetId = targetUserId || user?.id;

  return (
    <FullProfileView
      userId={activeTargetId}
      onBack={() => navigateTo("dashboard", "user-directory")}
      backLabel="Back to Creator Directory"
    />
  );
};

export default ProfileOverview;
