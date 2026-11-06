import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  BadgeAlert, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ShieldAlert, 
  Settings, 
  Tag, 
  AlertTriangle, 
  Activity, 
  HardDrive, 
  Search, 
  Lock, 
  RefreshCw, 
  Sliders, 
  Mail, 
  FileText, 
  Layers, 
  Radio,
  Eye,
  Edit2,
  Check,
  Library,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Slash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  EyeOff,
  Ban,
  BookOpen,
  CheckSquare,
  Square,
  X,
  ShieldCheck,
  Image as ImageIcon,
  Video,
  Globe,
  Upload,
  RotateCcw,
  FileCheck,
  Crown,
  Trophy,
  Award,
  Plus,
  Calendar,
  Star,
  Key,
  Filter,
  CheckCheck,
  User as UserIcon
} from "lucide-react";
import { useAppState } from "../context/AppState.js";
import type { User, SystemSettings, BadgeDefinition, UserBadgeAward, BadgeCategory, SupportTicket, TicketMessage } from "../types.js";
import { motion } from "motion/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal.js";
import { RoleBadge } from "./RoleBadge.js";
import { TagAnalytics } from "./TagAnalytics.js";
import { db } from "../lib/db.js";
import { validateFaviconFile, DEFAULT_FAVICON_URL } from "../lib/favicon.js";
import { DocumentationManagement } from "./DocumentationManagement.js";
import { TicketCenter } from "./TicketCenter.js";

type AdminTab = "overview" | "users" | "moderation" | "tags" | "reports" | "security" | "settings" | "super-admin" | "badges" | "docs";

export const AdminWorkspace: React.FC = () => {
  const { 
    user, 
    token, 
    triggerToast, 
    activeTab, 
    navigateTo, 
    systemSettings, 
    saveSystemSettings, 
    uploadFavicon, 
    resetFavicon, 
    createNotification, 
    followActionCount, 
    triggerDBSync, 
    dbActionCount 
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<AdminTab>("overview");
  const [reportsView, setReportsView] = useState<"inbox" | "tickets">("inbox");
  
  // High-fidelity central Directory state (switches users accounts and paginated tags directory)
  const [directoryViewMode, setDirectoryViewMode] = useState<"users" | "tags">("users");
  const [selectedUsersForBulk, setSelectedUsersForBulk] = useState<string[]>([]);
  
  // Tag Catalog Paginators inside Directory & Admin
  const [adminTagPage, setAdminTagPage] = useState(1);
  const tagsPerPage = 10;

  // Taxonomy Nodes Pagination
  const [taxonomyNodePage, setTaxonomyNodePage] = useState(1);
  const nodesPerPage = 10;

  // Real-time complete database approvals lists
  const [allBlogs, setAllBlogs] = useState<any[]>([]);
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);

  // Super Admin Tools: Tag Preview Manager states
  const [selectedTagDetail, setSelectedTagDetail] = useState<any | null>(null);
  const [deletedTagsBackup, setDeletedTagsBackup] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`nv_deleted_tags_${user?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist local blocked/deleted list helpers
  const saveDeletedTagsLocal = (newlist: any[]) => {
    setDeletedTagsBackup(newlist);
    try {
      localStorage.setItem(`nv_deleted_tags_${user?.id}`, JSON.stringify(newlist));
    } catch(err) {
      console.warn("Storage quota exceeded", err);
    }
  };

  // Synchronize internal layout panels with high-fidelity sidebar tabs
  useEffect(() => {
    if (activeTab === "admin-dashboard") {
      setActiveSubTab("overview");
    } else if (activeTab === "admin-directory") {
      setActiveSubTab("users");
    } else if (activeTab === "admin-content") {
      setActiveSubTab("moderation");
    } else if (activeTab === "admin-reports") {
      setActiveSubTab("reports");
    } else if (activeTab === "admin-badges") {
      setActiveSubTab("badges");
    } else if (activeTab === "admin-analytics") {
      setActiveSubTab("overview");
    } else if (activeTab === "admin-settings") {
      setActiveSubTab("settings");
    } else if (activeTab === "admin-audit") {
      setActiveSubTab("security");
    } else if (activeTab === "admin-super") {
      setActiveSubTab("super-admin");
    } else if (activeTab === "admin-docs") {
      setActiveSubTab("docs");
    }
  }, [activeTab]);
  
  // Real-time overview counters data
  const [dbStats, setDbStats] = useState({
    totalUsers: 142,
    activeUsers: 84,
    newUsersToday: 9,
    totalBlogs: 28,
    totalPhotos: 46,
    totalVideos: 18,
    totalTags: 15,
    totalViews: 4250,
    totalComments: 312,
    totalLikes: 1140,
    totalReports: 12,
    pendingReviews: 4,
    approvedContent: 88,
    rejectedContent: 6,
    storageUsageMB: 48.4,
  });

  const [pendingBlogs, setPendingBlogs] = useState<any[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [pendingVideos, setPendingVideos] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [tagsStats, setTagsStats] = useState<any[]>([]);
  const blockedTagsList = tagsStats.filter(t => t.isBanned).map(t => t.name.toLowerCase());
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  
  // Tag moderation forms state
  const [selectedTagToMod, setSelectedTagToMod] = useState<any | null>(null);
  const [renameTagNewWord, setRenameTagNewWord] = useState("");
  const [tagMergeSource, setTagMergeSource] = useState("");
  const [tagMergeTarget, setTagMergeTarget] = useState("");
  
  // Interactive rejections motives specify
  const [activeRejectTarget, setActiveRejectTarget] = useState<{ id: string; type: "blog" | "photo" | "video"; mode: "REJECT" | "REVISION" } | null>(null);
  const [rejectionRationale, setRejectionRationale] = useState("");

  // Report resolution target
  const [activeReportToResolve, setActiveReportToResolve] = useState<any | null>(null);
  const [reportResolutionText, setReportResolutionText] = useState("");

  // User details overlay inspector
  const [inspectedUser, setInspectedUser] = useState<User | null>(null);

  // Search Filter Keywords
  const [userQuery, setUserQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [contentQuery, setContentQuery] = useState("");
  const [reportQuery, setReportQuery] = useState("");
  const [logQuery, setLogQuery] = useState("");
  const [reportFilter, setReportFilter] = useState<"ALL" | "RESOLVED" | "PENDING">("ALL");

  // System Settings state mirrors
  const [localSettings, setLocalSettings] = useState<SystemSettings>(systemSettings);

  // Favicon Management state
  const [stagedFaviconFile, setStagedFaviconFile] = useState<File | null>(null);
  const [stagedFaviconPreview, setStagedFaviconPreview] = useState<string | null>(null);
  const [isSavingFavicon, setIsSavingFavicon] = useState(false);
  const [isResettingFavicon, setIsResettingFavicon] = useState(false);

  useEffect(() => {
    setLocalSettings(systemSettings);
  }, [systemSettings]);

  // Content deletion modal inside reports
  const [contentToDeleteLog, setContentToDeleteLog] = useState<any | null>(null);
  
  // Tag deletion and previewing variables
  const [tagToPurge, setTagToPurge] = useState<any | null>(null);
  const [tagToDelete, setTagToDelete] = useState<any | null>(null);
  const [previewTag, setPreviewTag] = useState<any | null>(null);
  const [selectedTagsForBulk, setSelectedTagsForBulk] = useState<string[]>([]);
  const [bulkTagDeleteModalOpen, setBulkTagDeleteModalOpen] = useState(false);

  // Badge Management States
  const [badgeSubSection, setBadgeSubSection] = useState<"clearance" | "catalog" | "history">("clearance");
  const [unlockBadgeModalOpen, setUnlockBadgeModalOpen] = useState(false);
  const [selectedBadgeToUnlock, setSelectedBadgeToUnlock] = useState<string>("verified-creator");
  const [badgeReason, setBadgeReason] = useState("");
  const [badgeDate, setBadgeDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUnlockingBadge, setIsUnlockingBadge] = useState(false);
  const [createBadgeModalOpen, setCreateBadgeModalOpen] = useState(false);
  const [allSystemBadges, setAllSystemBadges] = useState<BadgeDefinition[]>([]);
  const [allBadgeAwards, setAllBadgeAwards] = useState<UserBadgeAward[]>([]);
  const [badgeAuditSearch, setBadgeAuditSearch] = useState("");
  const [selectedBadgeToManage, setSelectedBadgeToManage] = useState<BadgeDefinition | null>(null);
  const [newBadgeForm, setNewBadgeForm] = useState<{
    id: string;
    name: string;
    icon: string;
    description: string;
    category: BadgeCategory;
    tier: number;
    requirement: string;
    colorScheme: string;
  }>({
    id: "",
    name: "",
    icon: "Shield",
    description: "",
    category: "COMMUNITY",
    tier: 1,
    requirement: "",
    colorScheme: "purple"
  });

  // Sync settings when context loaded
  useEffect(() => {
    if (systemSettings) {
      setLocalSettings(systemSettings);
    }
  }, [systemSettings]);

  // Reset taxonomyNodePage when tagQuery changes
  useEffect(() => {
    setTaxonomyNodePage(1);
  }, [tagQuery]);

  useEffect(() => {
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) return;

    // Listen to all content for moderation and stats
    loadAllAdminMetrics();

    const handleTagChange = () => {
      loadAllAdminMetrics();
    };
    window.addEventListener("nightverse_tags_updated", handleTagChange);

    // Setting up secondary periodic sync
    const interval = setInterval(loadAllAdminMetrics, 30000); // 30s heartbeat
    return () => {
      clearInterval(interval);
      window.removeEventListener("nightverse_tags_updated", handleTagChange);
    };
  }, [user, followActionCount, dbActionCount]);

  // Derived stats from listeners
  useEffect(() => {
    // Stats are now directly provided by the metrics API or derived from users/content lists
  }, [allBlogs, allPhotos, allVideos, usersList, reportsList, tagsStats, pendingBlogs, pendingPhotos, pendingVideos]);

  const loadAllAdminMetrics = () => {
    const allUsers = db.users.getAll();
    const allBlogs = db.blogs.getAll();
    const allPhotos = db.photos.getAll();
    const allVideos = db.videos.getAll();
    const allTags = db.tags.getAll();
    const allReports = db.reports?.getAll ? db.reports.getAll() : [];
    const allLogs = db.logs.getAll();

    setUsersList(allUsers);
    setReportsList(allReports);
    setTagsStats(allTags);
    setSystemLogs(allLogs);
    setAllSystemBadges(db.badges?.getAll ? db.badges.getAll() : []);
    setAllBadgeAwards(db.badges?.getAwards ? db.badges.getAwards() : []);

    setPendingBlogs(allBlogs.filter(b => b.status === "PENDING"));
    setPendingPhotos(allPhotos.filter(p => p.status === "PENDING"));
    setPendingVideos(allVideos.filter(v => v.status === "PENDING"));

    setDbStats({
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => !u.isSuspended).length,
      newUsersToday: allUsers.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length,
      totalBlogs: allBlogs.length,
      totalPhotos: allPhotos.length,
      totalVideos: allVideos.length,
      totalTags: allTags.length,
      totalViews: [...allBlogs, ...allPhotos, ...allVideos].reduce((acc, i) => acc + (i.views || 0), 0),
      totalComments: [...allBlogs, ...allPhotos, ...allVideos].reduce((acc, i) => acc + (i.comments?.length || 0), 0),
      totalLikes: [...allBlogs, ...allPhotos, ...allVideos].reduce((acc, i) => acc + (i.likesCount || 0), 0),
      totalReports: allReports.length,
      pendingReviews: allBlogs.filter(b => b.status === "PENDING").length + allPhotos.filter(p => p.status === "PENDING").length + allVideos.filter(v => v.status === "PENDING").length,
      approvedContent: allBlogs.filter(b => b.status === "APPROVED").length + allPhotos.filter(p => p.status === "APPROVED").length + allVideos.filter(v => v.status === "APPROVED").length,
      rejectedContent: allBlogs.filter(b => b.status === "REJECTED").length + allPhotos.filter(p => p.status === "REJECTED").length + allVideos.filter(v => v.status === "REJECTED").length,
      storageUsageMB: db.maintenance.getUsage().usedMB as any,
      storagePercent: db.maintenance.getUsage().percentage as any
    });
  };

  const handleManualCleanup = () => {
    db.maintenance.purgeOldData();
    triggerToast("Manual Cleanup Complete", "System purged historical logs and read notifications to reclaim space.", "success");
    loadAllAdminMetrics();
  };

  // Review approval decision click
  const handleReviewDecision = (id: string, type: "blog" | "photo" | "video", approved: boolean, reason?: string, isRevision: boolean = false) => {
    const status = isRevision ? "REVISION" : (approved ? "APPROVED" : "REJECTED");
    if (type === "blog") db.blogs.update(id, { status, rejectReason: reason });
    else if (type === "photo") db.photos.update(id, { status, rejectReason: reason });
    else if (type === "video") db.videos.update(id, { status, rejectReason: reason });

    db.logs.add("MODERATION", `${user?.username} reviewed ${type} ${id} as ${status}. Reason: ${reason || "N/A"}`, user?.username || "SYSTEM");

    // Clear related notifications
    const allNotes = db.notifications.getAll();
    const relatedNote = allNotes.find(n => n.targetId === id && n.type === "moderation_request" && !n.actionTaken);
    if (relatedNote) {
      db.notifications.markAsTaken(relatedNote.id, user?.username || "ADMIN", status);
    }

    triggerToast(
      isRevision ? "Revision Requested 📝" : (approved ? "Publication Approved! 🎉" : "Publication Suspended 🛑"), 
      isRevision ? "User notified for necessary changes." : (approved ? "Content pushed to public galleries" : `Rejected dispatch. Reason: ${reason}`), 
      isRevision ? "info" : (approved ? "success" : "info")
    );
    setActiveRejectTarget(null);
    setRejectionRationale("");
    triggerDBSync();
    loadAllAdminMetrics();
  };

  // Delete content completely
  const handleDeleteContent = (id: string, type: string) => {
    if (type.toLowerCase() === "blog") db.blogs.delete(id);
    else if (type.toLowerCase() === "photo") db.photos.delete(id);
    else if (type.toLowerCase() === "video") db.videos.delete(id);

    db.logs.add("DELETE_CONTENT", `${user?.username} purged ${type} ${id}`, user?.username || "SYSTEM");

    triggerToast("Content Deleted", "Asset successfully purged from system.", "success");
    loadAllAdminMetrics();
  };

  // Suspend Toggle user action
  const handleUserMuteToggle = (userId: string, isSuspended: boolean) => {
    db.users.update(userId, { isSuspended: !isSuspended });
    db.logs.add("USER_MOD", `${user?.username} ${!isSuspended ? 'suspended' : 'unsuspended'} user ${userId}`, user?.username || "SYSTEM");

    triggerToast(
      !isSuspended ? "User Suspended ⚠️" : "User Access Restored ✅", 
      !isSuspended ? "Account locked. Revoked credentials instantly." : "Account access reinstated.", 
      "success"
    );
    loadAllAdminMetrics();
    if (inspectedUser && inspectedUser.id === userId) {
      setInspectedUser(prev => prev ? { ...prev, isSuspended: !isSuspended } : null);
    }
  };

  // Update User Role classification
  const handleRoleModification = (userId: string, nextRole: string) => {
    db.users.update(userId, { role: nextRole as any });
    db.logs.add("USER_MOD", `${user?.username} changed role of user ${userId} to ${nextRole}`, user?.username || "SYSTEM");

    triggerToast("RBAC Clearance Upgraded 🔐", `User role transitioned to ${nextRole} successfully.`, "success");
    loadAllAdminMetrics();
    if (inspectedUser && inspectedUser.id === userId) {
      setInspectedUser(prev => prev ? { ...prev, role: nextRole as any } : null);
    }
  };

  // Reports handler
  const handleResolveReport = (reportId: string, resolutionMessage: string) => {
    if (db.reports?.update) {
      db.reports.update(reportId, { isResolved: true, resolutionNotes: resolutionMessage });
    }
    db.logs.add("REPORT_MOD", `${user?.username} resolved report ${reportId}`, user?.username || "SYSTEM");

    triggerToast("Report Resolved ✅", "Action filed and closed in audit logs.", "success");
    setActiveReportToResolve(null);
    setReportResolutionText("");
    loadAllAdminMetrics();
  };

  // Tag Management helpers
  const handleRenameTag = () => {
    if (!selectedTagToMod || !renameTagNewWord.trim()) return;
    db.tags.update(selectedTagToMod.id, { name: renameTagNewWord.trim().toLowerCase() });
    
    triggerToast("Tag Renamed", `Tag successfully morphed into #${renameTagNewWord}`, "success");
    setSelectedTagToMod(null);
    setRenameTagNewWord("");
    loadAllAdminMetrics();
  };

  const handleMergeTags = () => {
    if (!tagMergeSource.trim() || !tagMergeTarget.trim()) return;
    const sourceTag = db.tags.getAll().find(t => t.name.toLowerCase() === tagMergeSource.toLowerCase());
    const targetTag = db.tags.getAll().find(t => t.name.toLowerCase() === tagMergeTarget.toLowerCase());

    if (!sourceTag || !targetTag) {
      triggerToast("Merge Conflict", "One or both tags not found", "error");
      return;
    }

    // In a real app we'd update all content items using sourceTag to use targetTag
    // For this local simulation, we just delete source and update target count
    db.tags.delete(sourceTag.id);
    db.tags.update(targetTag.id, { count: (targetTag.count || 0) + (sourceTag.count || 0) });

    triggerToast("Tags Merged Successfully ⛓️", `All references consolidated into #${tagMergeTarget}`, "success");
    setTagMergeSource("");
    setTagMergeTarget("");
    loadAllAdminMetrics();
  };

  const handleDeleteTagConfirm = (tagId: string, tagName: string) => {
    db.tags.delete(tagId);
    triggerToast("Tag Blocked & Purged", `Cleaned hashtag #${tagName} resources.`, "info");
    loadAllAdminMetrics();
  };

  // Badge Management System: Hierarchical Permissions & Handlers
  const canOperatorGrantBadge = (operatorRole?: string, badge?: BadgeDefinition): boolean => {
    if (!operatorRole || !badge) return false;
    if (operatorRole === "SUPER_ADMIN") return true; // Super Admin can grant ANY badge without exception
    if (operatorRole === "ADMIN") {
      // Admin can only grant badges BELOW Admin tier (Tier < 4: Verified, Contributor, VIP, etc.)
      return badge.tier < 4 && badge.id !== "super-admin" && badge.id !== "administrator";
    }
    if (operatorRole === "MODERATOR") {
      // Moderator can only grant badges BELOW Moderator tier (Tier < 3: Verified, Contributor, VIP, etc.)
      return badge.tier < 3 && badge.id !== "super-admin" && badge.id !== "administrator" && badge.id !== "moderator";
    }
    return false;
  };

  const getBadgeIconComponent = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case "shieldalert": return ShieldAlert;
      case "shieldcheck": return ShieldCheck;
      case "shield": return Shield;
      case "checkcircle2": return CheckCircle2;
      case "trophy": return Trophy;
      case "crown": return Crown;
      case "sparkles": return Sparkles;
      case "star": return Star;
      case "award": return Award;
      case "lock": return Lock;
      case "user": default: return UserIcon;
    }
  };

  const handleUnlockBadgeSubmit = async () => {
    if (!inspectedUser || !user) return;
    setIsUnlockingBadge(true);

    try {
      // Call backend database method with strict hierarchy enforcement
      const result = db.badges.awardBadge({
        operatorId: user.id,
        operatorUsername: user.username,
        operatorRole: user.role,
        targetUserId: inspectedUser.id,
        badgeId: selectedBadgeToUnlock,
        reason: badgeReason.trim() || undefined,
        date: badgeDate
      });

      if (!result.success) {
        triggerToast("Badge Unlock Blocked 🚫", result.message, "error");
        setIsUnlockingBadge(false);
        return;
      }

      // Notify recipient
      createNotification({
        userId: inspectedUser.id,
        title: "New Badge Unlocked 🎉",
        message: `Selamat! Anda telah dianugerahi badge "${result.award?.badgeName}" oleh @${user.username}.`,
        category: "SYSTEM",
        type: "BADGE_UNLOCK",
        link: "DASHBOARD:profile-settings"
      });

      triggerToast("Badge Unlocked 🏆", result.message, "success");
      triggerDBSync();

      // Refresh inspected user badges in place
      const updatedUser = db.users.getById(inspectedUser.id);
      if (updatedUser) {
        setInspectedUser(updatedUser);
      }
      loadAllAdminMetrics();
      setUnlockBadgeModalOpen(false);
      setBadgeReason("");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error", err.message || "Failed to unlock badge.", "error");
    } finally {
      setIsUnlockingBadge(false);
    }
  };

  const handleRevokeBadge = (targetUserId: string, badgeId: string) => {
    if (!user) return;
    const result = db.badges.revokeBadge({
      operatorRole: user.role,
      operatorUsername: user.username,
      targetUserId,
      badgeId
    });

    if (!result.success) {
      triggerToast("Revoke Failed ⚠️", result.message, "error");
      return;
    }

    triggerToast("Badge Revoked", result.message, "info");
    triggerDBSync();
    const updatedUser = db.users.getById(targetUserId);
    if (updatedUser && inspectedUser?.id === targetUserId) {
      setInspectedUser(updatedUser);
    }
    loadAllAdminMetrics();
  };

  const handleCreateBadgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "SUPER_ADMIN") {
      triggerToast("Unauthorized", "Only Super Admin can define new badges.", "error");
      return;
    }

    if (!newBadgeForm.id.trim() || !newBadgeForm.name.trim() || !newBadgeForm.description.trim()) {
      triggerToast("Validation Error", "Please provide badge ID, name, and description.", "error");
      return;
    }

    // Color scheme mappings
    const colorMap: Record<string, { color: string; bgColor: string; borderColor: string }> = {
      rose: { color: "text-rose-400", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/30" },
      purple: { color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
      cyan: { color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30" },
      blue: { color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
      emerald: { color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
      amber: { color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
      fuchsia: { color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10", borderColor: "border-fuchsia-500/30" }
    };

    const scheme = colorMap[newBadgeForm.colorScheme] || colorMap.purple;

    try {
      const badgeId = newBadgeForm.id.trim().toLowerCase().replace(/\s+/g, "-");
      const newBadge: BadgeDefinition = {
        id: badgeId,
        name: newBadgeForm.name.trim(),
        icon: newBadgeForm.icon,
        description: newBadgeForm.description.trim(),
        category: newBadgeForm.category,
        tier: Number(newBadgeForm.tier),
        status: "ACTIVE",
        requirement: newBadgeForm.requirement.trim() || "Diberikan oleh pengelola NightVerse.",
        createdAt: new Date().toISOString(),
        color: scheme.color,
        bgColor: scheme.bgColor,
        borderColor: scheme.borderColor
      };

      db.badges.add(newBadge);
      db.logs.add("BADGE_MANAGEMENT", `Super Admin @${user.username} created badge definition "${newBadge.name}" (Tier ${newBadge.tier})`, user.username);
      triggerToast("Badge Created ✨", `New badge "${newBadge.name}" registered in system.`, "success");
      triggerDBSync();
      loadAllAdminMetrics();
      setCreateBadgeModalOpen(false);
      setNewBadgeForm({
        id: "",
        name: "",
        icon: "Shield",
        description: "",
        category: "COMMUNITY",
        tier: 1,
        requirement: "",
        colorScheme: "purple"
      });
    } catch (err: any) {
      triggerToast("Creation Error", err.message || "Failed to create badge.", "error");
    }
  };

  // Media Approval Policy handlers (Super Admin clearance required)
  const handleMediaApprovalToggle = (type: "photo" | "video" | "blog") => {
    if (user?.role !== "SUPER_ADMIN") {
      triggerToast("Access Denied 🔒", "Hanya Super Admin yang dapat mengubah pengaturan ini.", "error");
      return;
    }

    const currentApproval = localSettings.mediaApproval || {
      photo: true,
      video: false,
      blog: true,
    };

    const nextVal = !currentApproval[type];
    const updatedApproval = {
      ...currentApproval,
      [type]: nextVal,
    };

    const updatedSettings = {
      ...localSettings,
      mediaApproval: updatedApproval,
    };

    setLocalSettings(updatedSettings);

    // Save directly to database so it persists across reloads (Requirement 8)
    // and without touching existing content status (Requirement 5)
    saveSystemSettings({ mediaApproval: updatedApproval });
    triggerDBSync();

    const typeLabels = { photo: "Photo", video: "Video", blog: "Blog" };
    triggerToast(
      `${typeLabels[type]} Approval Updated`,
      nextVal ? "Automatic Publishing Enabled" : "Manual Approval Required",
      nextVal ? "success" : "info"
    );
  };

  const handleToggleAllMediaApproval = (enabled: boolean) => {
    if (user?.role !== "SUPER_ADMIN") {
      triggerToast("Access Denied 🔒", "Hanya Super Admin yang dapat mengubah pengaturan ini.", "error");
      return;
    }

    const updatedApproval = {
      photo: enabled,
      video: enabled,
      blog: enabled,
    };

    const updatedSettings = {
      ...localSettings,
      mediaApproval: updatedApproval,
    };

    setLocalSettings(updatedSettings);
    saveSystemSettings({ mediaApproval: updatedApproval });
    triggerDBSync();

    triggerToast(
      "All Media Approval Policies Updated",
      enabled ? "Automatic Publishing Enabled for all 3 formats" : "Manual Approval Required for all 3 formats",
      enabled ? "success" : "info"
    );
  };

  const handleFaviconFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (user?.role !== "SUPER_ADMIN") {
      triggerToast("Akses Ditolak 🔒", "Hanya Super Admin yang dapat mengganti favicon website.", "error");
      e.target.value = "";
      return;
    }

    const validation = validateFaviconFile(file);
    if (!validation.isValid) {
      triggerToast("Format File Tidak Valid ⚠️", validation.error || "File tidak memenuhi syarat.", "error");
      e.target.value = "";
      return;
    }

    // Generate local preview
    const reader = new FileReader();
    reader.onload = () => {
      setStagedFaviconFile(file);
      setStagedFaviconPreview(reader.result as string);
      triggerToast("Preview Favicon Siap", `File "${file.name}" siap disimpan. Klik Save Changes untuk menerapkan.`, "info");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFaviconChanges = async () => {
    if (!stagedFaviconFile) return;
    if (user?.role !== "SUPER_ADMIN") {
      triggerToast("Akses Ditolak 🔒", "Hanya Super Admin yang dapat menyimpan perubahan favicon.", "error");
      return;
    }

    setIsSavingFavicon(true);
    const result = await uploadFavicon(stagedFaviconFile);
    setIsSavingFavicon(false);

    if (result.success) {
      setStagedFaviconFile(null);
      setStagedFaviconPreview(null);
    }
  };

  const handleCancelFaviconStaging = () => {
    setStagedFaviconFile(null);
    setStagedFaviconPreview(null);
    triggerToast("Perubahan Dibatalkan", "Preview favicon telah dibatalkan dan dikembalikan ke favicon aktif.", "info");
  };

  const handleResetFaviconToDefault = async () => {
    if (user?.role !== "SUPER_ADMIN") {
      triggerToast("Akses Ditolak 🔒", "Hanya Super Admin yang dapat mereset favicon.", "error");
      return;
    }

    setIsResettingFavicon(true);
    const success = await resetFavicon();
    setIsResettingFavicon(false);

    if (success) {
      setStagedFaviconFile(null);
      setStagedFaviconPreview(null);
    }
  };

  const handleSaveWorkspaceSettings = () => {
    saveSystemSettings(localSettings);
    loadAllAdminMetrics();
  };

  if (!user) return null;

  const totalPendingSize = pendingBlogs.length + pendingPhotos.length + pendingVideos.length;

  // Filtered lists
  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(userQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredTags = tagsStats.filter(t => 
    t.name.toLowerCase().includes(tagQuery.toLowerCase())
  );

  const filteredPendingBlogs = pendingBlogs.filter(b => 
    b.title.toLowerCase().includes(contentQuery.toLowerCase()) || 
    (b.description || "").toLowerCase().includes(contentQuery.toLowerCase())
  );
  
  const filteredPendingPhotos = pendingPhotos.filter(p => 
    p.title.toLowerCase().includes(contentQuery.toLowerCase()) || 
    (p.authorName || "").toLowerCase().includes(contentQuery.toLowerCase())
  );
  
  const filteredPendingVideos = pendingVideos.filter(v => 
    v.title.toLowerCase().includes(contentQuery.toLowerCase()) || 
    (v.authorName || "").toLowerCase().includes(contentQuery.toLowerCase())
  );

  const totalFilteredPendingSize = filteredPendingBlogs.length + filteredPendingPhotos.length + filteredPendingVideos.length;

  const adminTagPagesCount = Math.max(1, Math.ceil(filteredTags.length / tagsPerPage));
  const paginatedAdminTags = filteredTags.slice((adminTagPage - 1) * tagsPerPage, adminTagPage * tagsPerPage);

  const totalTaxonomyNodesCount = filteredTags.length;
  const totalTaxonomyNodePages = Math.max(1, Math.ceil(totalTaxonomyNodesCount / nodesPerPage));
  const activeTaxonomyNodePage = Math.max(1, Math.min(taxonomyNodePage, totalTaxonomyNodePages));
  const paginatedTaxonomyNodes = filteredTags.slice(
    (activeTaxonomyNodePage - 1) * nodesPerPage,
    activeTaxonomyNodePage * nodesPerPage
  );

  const handleBlockTagKeywordToggle = (tagName: string) => {
    const isBanned = blockedTagsList.includes(tagName.toLowerCase());
    db.tags.ban(tagName, !isBanned);
    
    if (!isBanned) {
      triggerToast("Keyword Blacklisted 🛑", `Hashtag #${tagName} is now banned. Post annotations are prevented.`, "info");
    } else {
      triggerToast("Keyword Unbanned ✅", `Hashtag #${tagName} has been lifted from platform-wide blacklists.`, "success");
    }
    triggerDBSync();
  };

  const handleHardPurgeTagAsset = (tagId: string, tagName: string) => {
    const found = tagsStats.find(t => t.id === tagId || t.name === tagName);
    const backupItem = found ? { ...found } : { id: tagId, name: tagName, count: 0, growthRate: 1.2 };
    
    const nextBackupList = [...deletedTagsBackup.filter(t => t.name !== tagName), backupItem];
    saveDeletedTagsLocal(nextBackupList);

    setTagsStats(prev => prev.filter(t => t.name !== tagName));
    triggerToast("Taxonomy Hard Purged 🗑️", `Hashtag #${tagName} has been moved to recovery vaults.`, "info");
    if (selectedTagDetail?.name === tagName) {
      setSelectedTagDetail(null);
    }
  };

  const handleRestorePurgedTagRecord = (purged: any) => {
    if (!tagsStats.find(t => t.name === purged.name)) {
      setTagsStats(prev => [...prev, purged]);
    }
    const nextBackupList = deletedTagsBackup.filter(t => t.id !== purged.id && t.name !== purged.name);
    saveDeletedTagsLocal(nextBackupList);
    triggerToast("Taxonomy Tree Restored 🌳", `Hashtag #${purged.name} has been reinstated successfully.`, "success");
  };

  const handleUnlinkTagFromAsset = (assetId: string, type: "blog" | "photo" | "video", tagName: string) => {
    if (type === "blog") {
      setAllBlogs(prev => prev.map(item => {
        if (item.id === assetId && item.tags) {
          return { ...item, tags: item.tags.filter((t: string) => t !== tagName) };
        }
        return item;
      }));
    } else if (type === "photo") {
      setAllPhotos(prev => prev.map(item => {
        if (item.id === assetId && item.tags) {
          return { ...item, tags: item.tags.filter((t: string) => t !== tagName) };
        }
        return item;
      }));
    } else if (type === "video") {
      setAllVideos(prev => prev.map(item => {
        if (item.id === assetId && item.tags) {
          return { ...item, tags: item.tags.filter((t: string) => t !== tagName) };
        }
        return item;
      }));
    }
    triggerToast("Asset Unlinked 🔗", `Removed annotation reference to #${tagName} for this ${type} element.`, "success");
  };

  const filteredReports = reportsList.filter(r => {
    const matchesFilter = reportFilter === "ALL" 
      || (reportFilter === "RESOLVED" && r.isResolved)
      || (reportFilter === "PENDING" && !r.isResolved);
    
    const matchesSearch = r.contentTitle?.toLowerCase()?.includes(reportQuery.toLowerCase())
      || r.contentId?.toLowerCase()?.includes(reportQuery.toLowerCase())
      || r.reporterUsername?.toLowerCase()?.includes(reportQuery.toLowerCase())
      || r.reason?.toLowerCase()?.includes(reportQuery.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  const filteredLogs = systemLogs.filter(l => 
    l.action?.toLowerCase()?.includes(logQuery.toLowerCase()) || 
    l.details?.toLowerCase()?.includes(logQuery.toLowerCase()) || 
    l.operator?.toLowerCase()?.includes(logQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans overflow-y-auto custom-scrollbar" id="admin-workspace-premium">
      
      {/* Dynamic top aurora gradient */}
      <div className="p-6 bg-slate-900/60 border border-slate-850 rounded-3xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-80 h-32 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-12 w-64 h-24 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] uppercase font-semibold rounded-full select-none tracking-widest">
              <ShieldAlert className="w-3 h-3 animate-pulse" /> Operator clearance level: {user.role}
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-space bg-gradient-to-r from-white via-slate-100 to-purple-300 bg-clip-text text-transparent">
              Operator Deck.
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Centralized platform orchestrator. Supervise system accounts profiles, investigate active user abuse reports, moderate content feeds, maintain hashtags, and configure global variables in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => {
                loadAllAdminMetrics();
                triggerToast("Diagnostics Pulled", "Platform status synchronized successfully.", "info");
              }}
              className="p-3 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all text-xs flex items-center gap-2 cursor-pointer"
              title="Synchronize telemetry state"
              id="btn-telemetry-sync-force"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synchronize Real-time Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE TAB BODY WITH ZERO REDUNDANT INLINE COMPLEXITY */}

      {/* 1. OVERVIEW TELEMETRY */}
      {activeSubTab === "overview" && (
        <div className="space-y-6" id="deck-telemetry-panel">
          
          {/* Bento grid numbers overview counters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Total Registered Users</span>
              <div className="flex items-baseline gap-2 mt-2.5">
                <span className="text-2xl md:text-3xl font-black font-space text-slate-100">{dbStats.totalUsers}</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">+{dbStats.newUsersToday} today</span>
              </div>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Active Session Users</span>
              <div className="flex items-baseline gap-2 mt-2.5">
                <span className="text-2xl md:text-3xl font-black font-space text-emerald-400">{dbStats.activeUsers}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
              </div>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Content Publications</span>
              <div className="flex items-baseline gap-2 mt-2.5">
                <span className="text-2xl md:text-3xl font-black font-space text-purple-400">{dbStats.totalBlogs + dbStats.totalPhotos + dbStats.totalVideos}</span>
                <span className="text-[10px] text-slate-500 font-mono">B/P/V split</span>
              </div>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Platform Tag Footprint</span>
              <div className="flex items-baseline gap-2 mt-2.5">
                <span className="text-2xl md:text-3xl font-black font-space text-cyan-400">{dbStats.totalTags}</span>
                <span className="text-[10px] text-slate-500 font-mono">hashtags</span>
              </div>
            </div>

            <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl col-span-2 md:col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Server Sandbox Storage</span>
                  <div className="flex items-baseline gap-2 mt-2.5">
                    <span className={`text-2xl md:text-3xl font-black font-space ${Number((dbStats as any).storagePercent) > 90 ? 'text-rose-500' : 'text-indigo-400'}`}>
                      {dbStats.storageUsageMB} MB
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">/ 1,048,576 MB</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className={`px-2 py-1 rounded-md text-[9px] font-mono font-bold ${Number((dbStats as any).storagePercent) > 90 ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                      {Number((dbStats as any).storagePercent) < 0.01 ? '< 0.01' : (dbStats as any).storagePercent}% FULL
                   </div>
                   <button 
                    onClick={handleManualCleanup}
                    className="p-1 px-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-lg text-[9px] font-mono text-slate-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                   >
                     <RefreshCw className="w-3 h-3 text-indigo-500" /> CLEANUP
                   </button>
                </div>
              </div>
              
              {/* Simple health bar */}
              <div className="mt-4 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${Number((dbStats as any).storagePercent) > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                  style={{ width: `${Math.max(1, Number((dbStats as any).storagePercent))}%` }}
                ></div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Real responsive custom SVG statistics charts */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6">
              
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-purple-500 font-bold block">User growth & publications volume timeline</span>
                <h3 className="text-base font-extrabold font-space text-slate-100 mt-1">Platform Activity Metrics Trend</h3>
              </div>

              {/* SVG Area/Line graph representation */}
              <div className="relative h-64 w-full bg-slate-900/20 border border-slate-900/70 rounded-2xl flex flex-col justify-between p-4">
                
                {/* Background Grid Lines */}
                <div className="absolute inset-x-0 top-1/4 border-b border-slate-900/40 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-2/4 border-b border-slate-900/40 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-3/4 border-b border-slate-900/40 pointer-events-none"></div>

                <svg className="w-full h-44 mt-4 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path 
                    d="M 0,20 L 0,16 Q 20,8 40,11 T 80,4 Q 90,6 100,2 L 100,20 Z" 
                    fill="url(#areaGlow)" 
                  />
                  {/* Glowing Line */}
                  <path 
                    d="M 0,16 Q 20,8 40,11 T 80,4 Q 90,6 100,2" 
                    fill="none" 
                    stroke="#c084fc" 
                    strokeWidth="0.8" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_2px_8px_rgba(192,132,252,0.5)]"
                  />
                </svg>

                {/* Legend tags */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-900/50">
                  <span>Mon (23)</span>
                  <span>Tue (38)</span>
                  <span>Wed (64)</span>
                  <span>Thu (91)</span>
                  <span>Fri ({dbStats.totalUsers} Active)</span>
                </div>

              </div>

              {/* Pie/Donut Chart breakdown + Bar Chart breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-center gap-6">
                  {/* Gorgeous Mini SVG Donut Chart */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-900" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      {/* Photos segment (45%) */}
                      <path className="text-purple-500" strokeDasharray="45, 100" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      {/* Blogs segment (35%) */}
                      <path className="text-cyan-400" strokeDasharray="35, 100" strokeDashoffset="-45" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      {/* Videos segment (20%) */}
                      <path className="text-indigo-400" strokeDasharray="20, 100" strokeDashoffset="-80" strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] select-none text-slate-400">
                      <span className="font-bold text-slate-250">Split</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 text-xs">
                    <span className="text-[10px] text-slate-500 block">Content Distribution</span>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-350"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Photos</span>
                      <span className="font-mono text-slate-400">{dbStats.totalPhotos} ({Math.round((dbStats.totalPhotos/Math.max(1, dbStats.totalBlogs + dbStats.totalPhotos + dbStats.totalVideos))*100)}%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-350"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Blogs</span>
                      <span className="font-mono text-slate-400">{dbStats.totalBlogs} ({Math.round((dbStats.totalBlogs/Math.max(1, dbStats.totalBlogs + dbStats.totalPhotos + dbStats.totalVideos))*100)}%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-350"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Videos</span>
                      <span className="font-mono text-slate-400">{dbStats.totalVideos} ({Math.round((dbStats.totalVideos/Math.max(1, dbStats.totalBlogs + dbStats.totalPhotos + dbStats.totalVideos))*100)}%)</span>
                    </div>
                  </div>

                </div>

                <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex flex-col justify-between gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Review Pipeline Ingests</span>
                    <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 py-0.5 px-2 rounded-full font-mono">{dbStats.pendingReviews} pending</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Approved Platform Content</span>
                      <span className="text-slate-100 font-mono">{dbStats.approvedContent} posts</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Rejected & Filtered Out</span>
                      <span className="text-slate-100 font-mono">{dbStats.rejectedContent} posts</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: "8%" }}></div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* SSE Broadcast Monitor Activity Stream Panel */}
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 h-full flex flex-col space-y-4">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-emerald-400 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live SSE broadcasts receiver
                </span>
                <h3 className="text-base font-extrabold font-space text-slate-100 mt-1">Telemetry Traffic Feed</h3>
              </div>

              <div className="bg-slate-900/10 border border-slate-900/60 rounded-2xl p-4 overflow-y-auto max-h-[380px] font-mono space-y-3" id="sse-telemetry-feed">
                {systemLogs.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-600 py-12">No packet payloads broadcasted recently.</p>
                ) : (
                  systemLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="text-[10px] leading-relaxed border-b border-slate-950 pb-2.5 last:border-0 hover:bg-slate-950/20 p-1.5 rounded transition-all">
                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-purple-400 font-bold">[{log.action.toUpperCase()}]</span>
                        <span className="text-[8px] text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-350 mt-1">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
              <p className="text-[9px] text-slate-500 italic text-center select-none pt-2">
                Protected administrative operations audit log. Permanently recorded.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* 2. USER DECK */}
      {activeSubTab === "users" && (
        <div className="space-y-6" id="deck-directory-panel">

          {/* Centered Directory View Mode Switcher */}
          <div className="flex bg-slate-950 border border-slate-900 rounded-2xl p-1 w-full sm:w-80 select-none">
            <button 
              type="button"
              onClick={() => {
                setDirectoryViewMode("users");
                triggerToast("Users Directory", "Displaying registered user accounts profiles catalog", "info");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold font-space tracking-wide transition-all cursor-pointer ${
                directoryViewMode === "users" ? "bg-purple-650 text-white font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" /> Users Catalog
            </button>
            <button 
              type="button"
              onClick={() => {
                setDirectoryViewMode("tags");
                triggerToast("Hashtags Directory", "Displaying paginated network hashtags index map", "info");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold font-space tracking-wide transition-all cursor-pointer ${
                directoryViewMode === "tags" ? "bg-purple-650 text-white font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              <Tag className="w-4 h-4" /> Tags Directory
            </button>
          </div>

          {directoryViewMode === "users" ? (
            <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl space-y-4 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold font-space text-slate-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" /> Creators Accounts Registry (RBAC Key policy)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Toggle credentials lock, modify role restrictions, and audit individual creators profiles.</p>
              </div>

              {/* User search bar */}
              <div className="w-full sm:w-80 relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input 
                  type="text"
                  placeholder="Filter users by username or email..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-900 border border-slate-850 rounded-xl focus:outline-none focus:border-purple-600 text-slate-200"
                  id="search-user-profiles-input"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] uppercase font-mono text-slate-500 select-none pb-4">
                    <th className="py-3 px-2 w-10">
                      <div 
                        onClick={() => {
                          const allOnPageSelected = filteredUsers.every(u => selectedUsersForBulk.includes(u.id));
                          if (allOnPageSelected) {
                            const pageIds = filteredUsers.map(u => u.id);
                            setSelectedUsersForBulk(prev => prev.filter(id => !pageIds.includes(id)));
                          } else {
                            const newIds = filteredUsers.map(u => u.id).filter(id => !selectedUsersForBulk.includes(id));
                            setSelectedUsersForBulk(prev => [...prev, ...newIds]);
                          }
                        }}
                        className="cursor-pointer p-1.5 hover:bg-slate-900 rounded-lg transition-all"
                        title="Select / Deselect all visible"
                      >
                        {filteredUsers.length > 0 && filteredUsers.every(u => selectedUsersForBulk.includes(u.id)) ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-2">Creator Entity</th>
                    <th className="py-3">Current Status</th>
                    <th className="py-3">Clearance Role</th>
                    <th className="py-3 text-right pr-4">Platform Actionables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">No match found inside active directories for query: "{userQuery}"</td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => {
                      const isUserSelected = selectedUsersForBulk.includes(usr.id);
                      return (
                        <tr key={usr.id} className={`hover:bg-slate-900/20 transition-colors ${isUserSelected ? 'bg-cyan-950/10' : ''}`}>
                          <td className="py-3.5 px-2">
                            <div className="flex items-center">
                              <div 
                                onClick={() => {
                                  if (isUserSelected) setSelectedUsersForBulk(prev => prev.filter(id => id !== usr.id));
                                  else setSelectedUsersForBulk(prev => [...prev, usr.id]);
                                }}
                                className="cursor-pointer p-2 hover:bg-slate-900 rounded-lg transition-all text-slate-600 hover:text-cyan-400"
                                title="Select creator"
                              >
                                {isUserSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-3">
                              <img 
                                src={usr.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${usr.username}`} 
                                className="w-8 h-8 rounded-xl object-cover border border-slate-850" 
                                alt="usr" 
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-200">@{usr.username}</span>
                                  {usr.role === "SUPER_ADMIN" && <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">ROOT</span>}
                                </div>
                                <p className="text-[10px] text-slate-500">{usr.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block text-[9px] font-mono font-black py-0.5 px-2 rounded-full border ${
                              !usr.isSuspended 
                                ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/30" 
                                : "bg-rose-955/35 text-rose-455 border-rose-900/30"
                            }`}>
                              {!usr.isSuspended ? "ACTIVE" : "SUSPENDED"}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <select 
                              value={usr.role}
                              onChange={(e) => handleRoleModification(usr.id, e.target.value)}
                              disabled={usr.id === user.id} // Cannot strip own admin credentials
                              className="text-[10.5px] bg-slate-900 border border-slate-850 rounded-lg py-1 px-2.5 text-purple-300 font-mono font-semibold cursor-pointer hover:border-purple-500/20 disabled:opacity-50"
                            >
                              <option value="USER">USER</option>
                              <option value="MODERATOR">MODERATOR</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>
                          <td className="py-3.5 text-right pr-2">
                             <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setInspectedUser(usr);
                                    triggerToast("Creator Dossier", `Opening telemetry for @${usr.username}`, "info");
                                  }}
                                  className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all"
                                  title="Preview Creator Profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    triggerToast("Manual Record Override", "User record modification panel is currently synchronized only.", "info");
                                  }}
                                  className="p-1.5 bg-slate-950 border border-slate-850 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-600 transition-all"
                                  title="Edit Creator Record"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUserMuteToggle(usr.id, usr.isSuspended)}
                                  disabled={usr.id === user.id}
                                  className={`p-1.5 rounded-lg transition-all border ${
                                    !usr.isSuspended 
                                      ? "text-rose-500 hover:text-white hover:bg-rose-600 border-rose-900/50" 
                                      : "text-emerald-400 hover:text-white hover:bg-emerald-600 border-emerald-900/50"
                                  } disabled:opacity-50`}
                                  title={!usr.isSuspended ? "Suspend Access" : "Restore account"}
                                >
                                  {usr.isSuspended ? <RefreshCw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {selectedUsersForBulk.length > 0 && (
                <div className="mt-6 flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl animate-in fade-in slide-in-from-bottom duration-300">
                   <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                        {selectedUsersForBulk.length} creators selected for batch operation
                      </span>
                   </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => {
                            if (selectedUsersForBulk.length === 0 || !token) return;
                            try {
                              for (const id of selectedUsersForBulk) {
                                await handleRoleModification(id, "MODERATOR");
                              }
                              triggerToast("Batch Promotion", `Successfully promoted ${selectedUsersForBulk.length} users to MODERATOR role`, "success");
                              setSelectedUsersForBulk([]);
                            } catch (err) {
                              triggerToast("Batch Error", "Failed some user promotions", "error");
                            }
                          }}
                          className="py-1.5 px-4 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-[10px] font-bold uppercase transition-all"
                        >
                          Promote to Moderator
                        </button>
                        <button
                          onClick={async () => {
                            if (selectedUsersForBulk.length === 0 || !token) return;
                            if (!window.confirm(`SUSPEND ${selectedUsersForBulk.length} USERS?`)) return;
                            try {
                              for (const id of selectedUsersForBulk) {
                                const usr = usersList.find(u => u.id === id);
                                if (usr && !usr.isSuspended) {
                                  await handleUserMuteToggle(usr.id, false);
                                }
                              }
                              triggerToast("Batch Suspended", `Successfully locked ${selectedUsersForBulk.length} accounts`, "info");
                              setSelectedUsersForBulk([]);
                            } catch (err) {
                               triggerToast("Batch Error", "Failed some user suspensions", "error");
                            }
                          }}
                          className="py-1.5 px-4 bg-rose-650 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold uppercase transition-all"
                        >
                          Batch Suspend
                        </button>
                        <button
                          onClick={() => setSelectedUsersForBulk([])}
                          className="text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors"
                        >
                          [DESELECT ALL]
                        </button>
                      </div>
                </div>
              )}
            </div>
          </div>

          ) : (
            <TagAnalytics />
          )}

          {/* Inspection details modal profile drawer */}
          {inspectedUser && (
            <div className="p-6 bg-slate-950 border border-slate-850 rounded-3xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-sm font-space font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-1.5"><Shield className="w-4 h-4 text-purple-400" /> Account Inspection Dossier: @{inspectedUser.username}</h4>
                <button onClick={() => setInspectedUser(null)} className="text-xs text-slate-500 hover:text-white">Close Dossier</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                
                <div className="text-center p-4 bg-slate-900/10 border border-slate-900 rounded-2xl flex flex-col items-center space-y-3">
                  <img src={inspectedUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${inspectedUser.username}`} className="w-24 h-24 rounded-full border-2 border-purple-500 pb-[1.5px] object-cover" alt="usr" />
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">@{inspectedUser.username}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{inspectedUser.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="py-0.5 px-2 bg-slate-950 border border-slate-850 rounded font-mono text-[9px]">ID: {inspectedUser.id}</span>
                    <span className="py-0.5 px-2 bg-slate-950 border border-slate-850 rounded font-mono text-[9px] capitalize">Role: {inspectedUser.role}</span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/10 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase">Creator Bio Description</span>
                      <p className="text-slate-300 font-sans leading-relaxed">{inspectedUser.profile?.bio || "No custom biography established by creator yet."}</p>
                    </div>
                    <div className="p-3 bg-slate-900/10 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase">Design Specialties</span>
                      <p className="text-slate-200 font-mono italic">{inspectedUser.profile?.headline || "Creative sandbox citizen"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 font-mono text-center text-[11px]">
                    <div className="p-2 bg-slate-950 border border-slate-900 rounded-xl">
                      <span className="text-[9px] text-slate-500 block">WEBSITE/LINK</span>
                      <a href={inspectedUser.profile?.website || "#"} target="_blank" rel="noreferrer" className="text-purple-400 hover:underline truncate inline-block max-w-full">{inspectedUser.profile?.website || "None"}</a>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-900 rounded-xl">
                      <span className="text-[9px] text-slate-500 block">WORKPLACE</span>
                      <span className="text-slate-300">{inspectedUser.profile?.location || "Cosmic Hub"}</span>
                    </div>
                    <div className="p-2 bg-slate-950 border border-slate-900 rounded-xl">
                      <span className="text-[9px] text-slate-500 block">MEMBER SINCE</span>
                      <span className="text-slate-400">June 2026</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/15 border border-slate-900 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-rose-400">CRITICAL ACCOUNT SUSPENSION GATE</span>
                      <p className="text-[11px] text-slate-400">Locking this account prevents them from publishing new items or modifying directories.</p>
                    </div>
                    <button 
                      onClick={() => handleUserMuteToggle(inspectedUser.id, inspectedUser.isSuspended)}
                      className={`text-[10px] font-bold font-space uppercase px-4 py-2 rounded-xl border ${
                        !inspectedUser.isSuspended 
                          ? "bg-rose-955/30 hover:bg-rose-950 text-rose-455 border-rose-900/40" 
                          : "bg-emerald-950/30 hover:bg-emerald-950 text-emerald-400 border-emerald-900/40"
                      }`}
                    >
                      {!inspectedUser.isSuspended ? "LOCK ACCOUNT INSTANTLY" : "UNLOCK ACCOUNT CREDENTIALS"}
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. MODERATION CONSOLE DESK */}
      {activeSubTab === "moderation" && (
        <div className="space-y-6" id="deck-moderation-panel">
          
          <div className="p-6 bg-slate-950 border border-slate-900 rounded-3xl space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
              <div>
                <h3 className="text-base font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                  <BadgeAlert className="w-5 h-5 text-rose-500" /> Pending Ingest Validation Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-1">Accept publication drafts onto public feeds, or suspend item dispatches with mandatory reject justification notices.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                   <input 
                     type="text"
                     placeholder="Filter queue by title/author..."
                     value={contentQuery}
                     onChange={(e) => setContentQuery(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-purple-500 outline-none"
                   />
                </div>
                <div className="px-3.5 py-1 bg-slate-900 rounded-xl font-mono text-[10.5px] font-bold text-rose-400 whitespace-nowrap">
                  {totalFilteredPendingSize} items require active auditing
                </div>
              </div>
            </div>

            {totalFilteredPendingSize === 0 ? (
              <div className="text-center py-20 bg-slate-900/10 border border-slate-900 border-dashed rounded-3xl select-none max-w-lg mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4 animate-bounce" />
                <h4 className="text-sm font-extrabold text-slate-200">{contentQuery ? "No Matches Found" : "Ingest Queue Clear!"}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {contentQuery ? `No pending items match your query "${contentQuery}".` : "Outstanding creations are currently empty. All blogs, high-resolution photography print grids, and video loop reels are approved."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Pending Blogs Section */}
                {filteredPendingBlogs.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-black block border-l-2 border-cyan-400 pl-2">Articles awaiting print validation ({filteredPendingBlogs.length})</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPendingBlogs.map(b => (
                        <div key={b.id} className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <h4 className="font-extrabold text-sm text-slate-100">{b.title}</h4>
                            <p className="text-[10.5px] text-slate-500">Draft by: @{b.authorName} • {new Date(b.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-400 line-clamp-2">{b.description}</p>
                          </div>
                          
                            <div className="flex gap-2 font-mono text-[10px] pt-3 border-t border-slate-900">
                            <button 
                              onClick={() => handleReviewDecision(b.id, "blog", true)}
                              className="flex-1 py-1.5 bg-emerald-950/30 hover:bg-emerald-950 text-emerald-400 font-bold border border-emerald-900/40 rounded-xl cursor-pointer"
                            >
                              ACCEPT
                            </button>
                            <button 
                              onClick={() => setActiveRejectTarget({ id: b.id, type: "blog", mode: "REVISION" })}
                              className="flex-1 py-1.5 bg-amber-950/20 hover:bg-amber-950 text-amber-500 font-bold border border-amber-900/40 rounded-xl cursor-pointer"
                            >
                              REVISE
                            </button>
                            <button 
                              onClick={() => setActiveRejectTarget({ id: b.id, type: "blog", mode: "REJECT" })}
                              className="flex-1 py-1.5 bg-rose-955/20 hover:bg-rose-950 text-rose-455 font-bold border border-rose-900/40 rounded-xl cursor-pointer"
                            >
                              DISCARD
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Photos Section */}
                {filteredPendingPhotos.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-black block border-l-2 border-purple-500 pl-2 font-space">Photos pending portfolio exhibit ({filteredPendingPhotos.length})</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPendingPhotos.map(p => (
                        <div key={p.id} className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex gap-4">
                          <img src={p.url || null} className="w-24 h-24 rounded-xl object-cover bg-slate-900 flex-shrink-0" alt="pending portfolio photography" />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-200 truncate">{p.title}</h4>
                              <p className="text-[10.5px] text-slate-500 mt-0.5">By: @{p.authorName} • source {p.sourceType}</p>
                            </div>
                            
                            <div className="flex gap-1.5 font-mono text-[9px] pt-2">
                              <button 
                                onClick={() => handleReviewDecision(p.id, "photo", true)}
                                className="flex-1 py-1.5 bg-emerald-950/20 hover:bg-emerald-950 text-emerald-400 font-extrabold rounded-lg"
                              >
                                APPROVE
                              </button>
                              <button 
                                onClick={() => setActiveRejectTarget({ id: p.id, type: "photo", mode: "REVISION" })}
                                className="flex-1 py-1.5 bg-amber-950/20 hover:bg-amber-950 text-amber-500 font-extrabold rounded-lg"
                              >
                                REVISE
                              </button>
                              <button 
                                onClick={() => setActiveRejectTarget({ id: p.id, type: "photo", mode: "REJECT" })}
                                className="flex-1 py-1.5 bg-rose-955/20 hover:bg-rose-950 text-rose-455 font-extrabold rounded-lg"
                              >
                                REJECT
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Videos Section */}
                {filteredPendingVideos.length > 0 && (
                  <div className="space-y-3 pt-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-black block border-l-2 border-indigo-500 pl-2 font-space">AV reels & loop files awaiting encoding ({filteredPendingVideos.length})</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPendingVideos.map(v => (
                        <div key={v.id} className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl flex gap-4">
                          <div className="w-24 h-20 bg-slate-900 rounded-xl overflow-hidden relative flex-shrink-0">
                            <img src={v.thumbnailUrl || null} className="w-full h-full object-cover opacity-60" alt="reel thumbnail" />
                            <span className="absolute inset-0 flex items-center justify-center text-xs">▶</span>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-200 truncate">{v.title}</h4>
                              <p className="text-[10.5px] text-slate-500 mt-0.5">By: @{v.authorName} • {v.duration}s [{v.resolution}]</p>
                            </div>
                            
                            <div className="flex gap-1.5 font-mono text-[9px] pt-2">
                              <button 
                                onClick={() => handleReviewDecision(v.id, "video", true)}
                                className="flex-1 py-1.5 bg-emerald-950/20 hover:bg-emerald-950 text-emerald-400 font-extrabold rounded-lg"
                              >
                                APPROVE
                              </button>
                              <button 
                                onClick={() => setActiveRejectTarget({ id: v.id, type: "video", mode: "REVISION" })}
                                className="flex-1 py-1.5 bg-amber-950/20 hover:bg-amber-950 text-amber-500 font-extrabold rounded-lg"
                              >
                                REVISE
                              </button>
                              <button 
                                onClick={() => setActiveRejectTarget({ id: v.id, type: "video", mode: "REJECT" })}
                                className="flex-1 py-1.5 bg-rose-955/20 hover:bg-rose-950 text-rose-450 font-extrabold rounded-lg"
                              >
                                REJECT
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Reject rationale prompt popup */}
            {activeRejectTarget && (
              <div className={`mt-6 p-5 border rounded-2xl space-y-3.5 animate-fadeIn ${
                activeRejectTarget.mode === "REVISION" ? "bg-amber-950/10 border-amber-500/20" : "bg-rose-950/10 border-rose-500/20"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    activeRejectTarget.mode === "REVISION" ? "text-amber-400" : "text-rose-400"
                  }`}>
                    {activeRejectTarget.mode === "REVISION" ? (
                      <>
                        <MessageSquare className="w-4 h-4" /> Specify mandatory revision instructions:
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" /> Specify mandatory reason for file suspension:
                      </>
                    )}
                  </span>
                  <button onClick={() => setActiveRejectTarget(null)} className="text-[10px] text-slate-500 hover:text-white">Cancel</button>
                </div>
                
                <input 
                  type="text"
                  placeholder={activeRejectTarget.mode === "REVISION" ? "e.g. Please clarify the second paragraph or update the thumbnail to better resolution." : "e.g. Dimensions of file fail minimal requirements..."}
                  value={rejectionRationale}
                  onChange={(e) => setRejectionRationale(e.target.value)}
                  className={`w-full text-xs py-3 px-4 bg-slate-950 rounded-xl border focus:outline-none text-slate-200 ${
                    activeRejectTarget.mode === "REVISION" ? "border-amber-950/80 focus:border-amber-500" : "border-rose-950/80 focus:border-rose-500"
                  }`}
                  id="rejection-motives-text-input"
                  required
                />
                <button 
                  onClick={() => handleReviewDecision(activeRejectTarget.id, activeRejectTarget.type, false, rejectionRationale, activeRejectTarget.mode === "REVISION")}
                  className={`py-2.5 px-6 rounded-xl font-bold font-space text-[10px] tracking-wider uppercase cursor-pointer shadow-lg active:scale-95 ${
                    activeRejectTarget.mode === "REVISION" ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/10" : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/10"
                  }`}
                >
                  {activeRejectTarget.mode === "REVISION" ? "SEND REVISION REQUEST" : "DISPATCH REJECTION NOTICE"}
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 4. SUPER ADMIN CORE: TAG PREVIEW MANAGER & AUDITOR */}
      {activeSubTab === "super-admin" && (
        <div className="space-y-6 animate-fadeIn" id="deck-super-admin-panel">
          
          {/* Header section with deep neon aurora styling */}
          <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-3xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none"></div>
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] uppercase font-bold rounded-full select-none tracking-widest">
                  <ShieldAlert className="w-3.5 h-3.5" /> High Clearance Console Gate
                </span>
                <h3 className="text-xl md:text-2xl font-black font-space bg-gradient-to-r from-white via-slate-100 to-indigo-350 bg-clip-text text-transparent">
                  Super Admin Taxonomy Auditor
                </h3>
                <p className="text-xs text-slate-400 max-w-xl font-sans mt-0.5">
                  Inspect raw hashtag taxonomy trees, identify the original creators, audit specific associated multimedia assets, manage live-blacklisted keywords, and restore purged markers.
                </p>
              </div>

              {/* Quick statistics widgets */}
              <div className="flex gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-2xl text-center min-w-28 space-y-0.5">
                  <span className="text-[9px] text-slate-505 block uppercase font-mono">Banned/Blocked</span>
                  <span className="text-sm font-black text-rose-451">{blockedTagsList.length} Labels</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-2xl text-center min-w-28 space-y-0.5">
                  <span className="text-[9px] text-slate-505 block uppercase font-mono">Purged History</span>
                  <span className="text-sm font-black text-cyan-400">{deletedTagsBackup.length} Purges</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Main Taxonomy Grid Column */}
            <div className="xl:col-span-2 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-5">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <h4 className="text-sm font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-purple-400" /> Live Platform Taxonomy Nodes
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans">Click a tag's audit button to inspect all content references globally.</p>
                </div>

                <div className="w-full sm:w-60 relative text-left">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input 
                    type="text"
                    placeholder="Search super admin tags..."
                    value={tagQuery}
                    onChange={(e) => setTagQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-850 rounded-xl focus:outline-none focus:border-indigo-400 text-slate-205 font-mono"
                  />
                </div>
              </div>

              {/* List of active tag nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="taxonomy-nodes-grid">
                {paginatedTaxonomyNodes.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-555 font-mono text-xs">
                    No active tags matched your audit query search.
                  </div>
                ) : (
                  paginatedTaxonomyNodes.map(tag => {
                    const isBanned = blockedTagsList.includes(tag.name);

                    return (
                      <div 
                        key={tag.id} 
                        className={`p-4 rounded-2xl border ${
                          selectedTagDetail?.name === tag.name 
                            ? "bg-slate-900/60 border-indigo-500 shadow-md shadow-indigo-950/25" 
                            : isBanned 
                            ? "bg-rose-955/5 border-rose-955/20" 
                            : "bg-slate-900/15 border-slate-900 hover:border-slate-800"
                        } space-y-3 transition-all`}
                        id={`taxonomy-node-${tag.id}`}
                      >
                        <div className="flex items-start justify-between min-w-0 gap-2">
                          <div className="min-w-0 text-left">
                            <span className={`font-mono font-bold flex items-center gap-1 text-sm ${isBanned ? "text-rose-500" : "text-slate-200"}`}>
                              <Tag className={`w-4 h-4 ${isBanned ? "text-rose-500" : "text-indigo-400"}`} /> #{tag.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[9px] text-slate-500 font-mono">Author ID: @{tag.mostActiveUsername || "nightmaster"}</span>
                              {isBanned && (
                                <span className="text-[9px] font-black bg-rose-955/20 text-rose-400 border border-rose-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  BANNED
                                </span>
                              )}
                              <span className={`text-[9px] font-bold px-1 rounded bg-slate-950/50 ${(tag.growthDaily ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {(tag.growthDaily ?? 0) >= 0 ? "+" : ""}{(tag.growthDaily ?? 0).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-lg select-none whitespace-nowrap leading-none mt-1">
                            {tag.usageCount || 0} hits
                          </span>
                        </div>

                        {/* Associated Content Multipliers */}
                        <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] text-slate-400">
                          <div className="p-1 bg-slate-950/40 border border-slate-900/60 rounded">
                            <span className="text-slate-500 block uppercase font-mono">Blogs</span>
                            <strong className="text-slate-205 text-xs">{tag.blogCount || 0}</strong>
                          </div>
                          <div className="p-1 bg-slate-950/40 border border-slate-900/60 rounded">
                            <span className="text-slate-555 block uppercase font-mono">Photos</span>
                            <strong className="text-slate-205 text-xs">{tag.photoCount || 0}</strong>
                          </div>
                          <div className="p-1 bg-slate-950/40 border border-slate-900/60 rounded">
                            <span className="text-slate-500 block uppercase font-mono">Videos</span>
                            <strong className="text-slate-205 text-xs">{tag.videoCount || 0}</strong>
                          </div>
                        </div>

                        {/* Node Actions Bar */}
                        <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5">
                          <div className="flex gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                handleBlockTagKeywordToggle(tag.name);
                              }}
                              className={`px-2 py-1 text-[9px] rounded font-mono font-bold transition-all cursor-pointer ${
                                isBanned 
                                  ? "bg-emerald-955/20 hover:bg-emerald-950 text-emerald-400 border border-emerald-900/40" 
                                  : "bg-rose-955/15 hover:bg-rose-950/20 text-rose-400 border border-rose-900/30"
                              }`}
                              id={`ban-btn-${tag.id}`}
                            >
                              {isBanned ? "UNBAN" : "BAN"}
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setTagToPurge(tag);
                              }}
                              className="px-2 py-1 bg-slate-950 text-rose-500 hover:bg-rose-955/20 border border-slate-900 text-[9px] rounded font-mono font-bold cursor-pointer"
                              title="Delete tag completely and move to recovery inventory"
                              id={`purge-btn-${tag.id}`}
                            >
                              PURGE
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedTagDetail(tag);
                              triggerToast("Asset References", `Inspecting associated assets for #${tag.name}`, "info");
                            }}
                            className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-550 text-white font-space text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            id={`refs-auditor-${tag.id}`}
                          >
                            <Eye className="w-3 h-3" /> References Auditor
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mobile-friendly Pagination and Node Information bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900 text-xs text-slate-400 font-mono" id="taxonomy-pagination-bar">
                <div className="text-center sm:text-left">
                  Showing <strong className="text-slate-200">{totalTaxonomyNodesCount === 0 ? 0 : (activeTaxonomyNodePage - 1) * nodesPerPage + 1}</strong> - <strong className="text-slate-200">{Math.min(activeTaxonomyNodePage * nodesPerPage, totalTaxonomyNodesCount)}</strong> of <strong className="text-purple-400">{totalTaxonomyNodesCount}</strong> Taxonomy Nodes
                </div>
                
                <div className="flex items-center gap-1.5 flex-wrap justify-center bg-slate-950 p-1 border border-slate-900 rounded-xl select-none">
                  {/* First Page */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={() => {
                      setTaxonomyNodePage(1);
                      triggerToast("First Page", "Navigated to the first page of taxonomy nodes.", "info");
                    }}
                    disabled={activeTaxonomyNodePage === 1}
                    className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center h-8"
                    title="First Page"
                    id="taxonomy-first-page-btn"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </motion.button>
                  
                  {/* Previous Page */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={() => {
                      setTaxonomyNodePage(prev => Math.max(1, prev - 1));
                    }}
                    disabled={activeTaxonomyNodePage === 1}
                    className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center h-8"
                    title="Previous Page"
                    id="taxonomy-prev-page-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>

                  <span className="px-3 py-1 bg-slate-900 border border-slate-850 rounded-lg text-slate-300 font-bold h-8 flex items-center justify-center text-xs select-none min-w-[60px]">
                    {activeTaxonomyNodePage} / {totalTaxonomyNodePages}
                  </span>

                  {/* Next Page */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={() => {
                      setTaxonomyNodePage(prev => Math.min(totalTaxonomyNodePages, prev + 1));
                    }}
                    disabled={activeTaxonomyNodePage === totalTaxonomyNodePages}
                    className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center h-8"
                    title="Next Page"
                    id="taxonomy-next-page-btn"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>

                  {/* Last Page */}
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={() => {
                      setTaxonomyNodePage(totalTaxonomyNodePages);
                      triggerToast("Last Page", `Jumped to the last page (${totalTaxonomyNodePages}) of taxonomy nodes.`, "info");
                    }}
                    disabled={activeTaxonomyNodePage === totalTaxonomyNodePages}
                    className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center h-8"
                    title="Last Page"
                    id="taxonomy-last-page-btn"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

            </div>

            {/* Sticky Super Admin Controls Sidebar */}
            <div className="space-y-6">
              
              {/* Block/Banned tag list drawer */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4 text-left">
                <div>
                  <h4 className="text-sm font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                    <XCircle className="w-4.5 h-4.5 text-rose-500" /> Banned Keyword Blacklist
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-1 font-sans">Platform-wide word filter. Any user attempting to use or publish content with these labels will be automatically rejected.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add forbidden keyword..."
                      id="input-add-banned-word"
                      className="text-xs font-mono bg-slate-900 border border-slate-850 rounded-xl py-2 px-3 text-slate-202 flex-1 focus:outline-none focus:border-rose-550"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("input-add-banned-word") as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleBlockTagKeywordToggle(input.value.trim().toLowerCase());
                          input.value = "";
                        }
                      }}
                      className="px-3.5 py-2 bg-rose-955/35 text-rose-455 border border-rose-900/40 font-bold uppercase rounded-xl hover:bg-rose-950 text-xs font-sans cursor-pointer whitespace-nowrap"
                    >
                      Ban
                    </button>
                  </div>

                  {/* Banned lists */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {blockedTagsList.length === 0 ? (
                      <p className="text-center py-4 text-[10px] uppercase font-mono text-slate-500">Blacklist is currently empty</p>
                    ) : (
                      blockedTagsList.map(keyword => (
                        <div key={keyword} className="flex items-center justify-between p-2 bg-slate-900/45 border border-slate-900 rounded-xl">
                          <span className="font-mono text-xs text-rose-400">#{keyword}</span>
                          <button 
                            type="button"
                            onClick={() => handleBlockTagKeywordToggle(keyword)}
                            className="text-[9px] font-mono text-slate-500 hover:text-white uppercase font-bold cursor-pointer"
                          >
                            Unban / Lift
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Tag Purged Bin / Restore vault */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4 text-left">
                <div>
                  <h4 className="text-sm font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                    <Trash2 className="w-4.5 h-4.5 text-cyan-400" /> Taxonomy Purge Vault
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-1 font-sans">Super administrative backup records. Purged tags can be restored back onto taxonomy trees with their complete history intact.</p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deletedTagsBackup.length === 0 ? (
                    <p className="text-center py-6 text-[10px] uppercase font-mono text-slate-500">No tags are inside recovery bin</p>
                  ) : (
                    deletedTagsBackup.map(purged => (
                      <div key={purged.id} className="p-2.5 bg-slate-1000 border border-slate-900 rounded-xl flex items-center justify-between">
                        <div className="text-left">
                          <span className="font-mono text-xs text-slate-200">#{purged.name}</span>
                          <span className="text-[8.5px] text-slate-505 font-mono block">Backup Count: {purged.count || 0}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRestorePurgedTagRecord(purged)}
                          className="px-2.5 py-1 bg-cyan-955/30 text-cyan-400 border border-cyan-900/40 text-[9px] rounded uppercase font-bold text-xs cursor-pointer"
                          title="Restore and rebuild tag directory indices"
                        >
                          Restore
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Reference Auditor Detail Page Drawer Panel */}
          {selectedTagDetail && (
            <div className="p-6 bg-slate-955 border border-slate-850 rounded-3xl space-y-5 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-905 pb-3 gap-4">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                      <BookOpen className="w-4.5 h-4.5 text-indigo-405" /> Active References Index: #{selectedTagDetail.name}
                    </h4>
                    <span className="text-[9px] font-mono uppercase bg-slate-900 border border-slate-850 text-indigo-400 px-2.5 py-0.5 rounded-full select-none">Auditor Page</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">Below are all active blogs, photos, and videos containing this tab tag annotation across active directories.</p>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setSelectedTagDetail(null)} 
                  className="px-3.5 py-1 text-xs text-slate-300 hover:text-white border border-slate-900 bg-slate-900 hover:bg-slate-800 rounded-xl select-none cursor-pointer"
                >
                  Close auditor overview
                </button>
              </div>

              {/* Dynamic tag metrics dossier */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
                <div className="p-3 bg-slate-900/10 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Original Creator</span>
                  <span className="text-indigo-400 font-bold">@{selectedTagDetail.mostActiveUsername || "nightmaster"}</span>
                </div>
                <div className="p-3 bg-slate-900/10 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Database ID</span>
                  <span className="text-slate-305 font-bold truncate block">ID: {selectedTagDetail.id}</span>
                </div>
                <div className="p-3 bg-slate-900/10 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Growth Index (24h)</span>
                  <span className={`${(selectedTagDetail.growthDaily ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"} font-bold`}>
                    {(selectedTagDetail.growthDaily ?? 0) >= 0 ? "+" : ""}{(selectedTagDetail.growthDaily ?? 0).toFixed(1)}% growth
                  </span>
                </div>
                <div className="p-3 bg-slate-900/10 rounded-2xl">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Taxonomy Last Active</span>
                  <span className="text-slate-400 font-bold font-mono">
                    {selectedTagDetail.lastUsedAt ? new Date(selectedTagDetail.lastUsedAt).toLocaleDateString() : "Never"}
                  </span>
                </div>
              </div>

              {/* Grid block of matching assets */}
              <div className="space-y-4">
                
                <h5 className="text-xs uppercase font-bold font-mono text-slate-400 border-b border-slate-900 pb-1.5 text-left text-left">
                  Annotated Asset Registry
                </h5>

                {/* Pull real filtered contents */}
                {(() => {
                  const matchingBlogs = allBlogs.filter(b => b.tags && b.tags.includes(selectedTagDetail.name));
                  const matchingPhotos = allPhotos.filter(p => p.tags && p.tags.includes(selectedTagDetail.name));
                  const matchingVideos = allVideos.filter(v => v.tags && v.tags.includes(selectedTagDetail.name));
                  
                  const totalReferences = matchingBlogs.length + matchingPhotos.length + matchingVideos.length;

                  if (totalReferences === 0) {
                    return (
                      <p className="text-center py-12 text-slate-500 text-xs font-mono lowercase bg-slate-900/5 border border-slate-900 rounded-2xl">
                        No active asset elements annotate "#{selectedTagDetail.name}" currently.
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Blogs */}
                      {matchingBlogs.map(blog => (
                        <div key={blog.id} className="p-4 bg-slate-900/15 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-3 text-left animate-fadeIn">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[9px] font-mono text-purple-400 font-black">
                              <span>BLOG POST DIRECTORY</span>
                              <span>@{blog.authorUsername || "author"}</span>
                            </div>
                            <h6 className="font-bold text-slate-205 line-clamp-1 text-xs">{blog.title}</h6>
                            <p className="text-[10.5px] text-slate-405 leading-snug line-clamp-2">{blog.summary}</p>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              // Perform standard tag unlink dispatch
                              handleUnlinkTagFromAsset(blog.id, "blog", selectedTagDetail.name);
                            }}
                            className="w-full py-1.5 bg-slate-950 hover:bg-rose-950/20 text-rose-455 hover:text-white border border-slate-905 text-[10px] font-mono font-bold uppercase rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm hover:border-rose-900"
                          >
                            Unlink Tag Reference
                          </button>
                        </div>
                      ))}

                      {/* Photos */}
                      {matchingPhotos.map(photo => (
                        <div key={photo.id} className="p-4 bg-slate-900/15 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-3 text-left animate-fadeIn">
                          <div className="space-y-1 text-left">
                            <div className="flex items-center justify-between text-[9px] font-mono text-cyan-404 font-black">
                              <span className="text-cyan-400">PHOTO EXHIBIT</span>
                              <span>@{photo.creatorUsername || "artist"}</span>
                            </div>
                            <img src={photo.url || null} className="w-full h-24 object-cover border border-slate-909 rounded-lg mt-1" alt="preview" referrerPolicy="no-referrer" />
                            <h6 className="font-bold text-slate-202 text-xs truncate mt-2">{photo.title || "Untitled Masterpiece"}</h6>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              handleUnlinkTagFromAsset(photo.id, "photo", selectedTagDetail.name);
                            }}
                            className="w-full py-1.5 bg-slate-900 hover:bg-rose-955/20 text-rose-455 text-white border border-slate-950 text-[10px] font-mono font-bold uppercase rounded-lg active:scale-95 transition-all cursor-pointer"
                          >
                            Unlink Tag Reference
                          </button>
                        </div>
                      ))}

                      {/* Videos */}
                      {matchingVideos.map(video => (
                        <div key={video.id} className="p-4 bg-slate-900/15 border border-slate-900 rounded-2xl flex flex-col justify-between space-y-3 text-left animate-fadeIn">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 font-black">
                              <span>VIDEO ASSET STREAM</span>
                              <span>@{video.creatorUsername || "videographer"}</span>
                            </div>
                            <div className="w-full h-24 bg-slate-905 rounded-lg border border-slate-900 flex flex-col items-center justify-center p-2 text-center text-slate-500 space-y-1">
                              <Radio className="w-5 h-5 text-emerald-505 animate-pulse" />
                              <span className="text-[9px] font-mono word-break line-clamp-1">{video.title || "Custom Stream Element"}</span>
                            </div>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              handleUnlinkTagFromAsset(video.id, "video", selectedTagDetail.name);
                            }}
                            className="w-full py-1.5 bg-slate-950 hover:bg-rose-955/20 text-rose-500 text-white border border-slate-950 text-[10px] font-mono font-bold uppercase rounded-lg active:scale-95 transition-all cursor-pointer"
                          >
                            Unlink Tag Reference
                          </button>
                        </div>
                      ))}

                    </div>
                  );
                })()}

              </div>

            </div>
          )}

        </div>
      )}



      {/* 5. REPORTS & TICKET CENTER */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 animate-fadeIn" id="deck-reports-panel">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setReportsView("inbox")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-space transition-all border ${
                  reportsView === "inbox" 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Abuse Reports
              </button>
              <button
                onClick={() => setReportsView("tickets")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-space transition-all border ${
                  reportsView === "tickets" 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Ticket Center
              </button>
            </div>

            {reportsView === "inbox" && (
              <div className="flex items-center gap-3">
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono"
                >
                  <option value="ALL">All Reports</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="RESOLVED">Resolved Only</option>
                </select>
              </div>
            )}
          </div>

          {reportsView === "tickets" ? (
            <TicketCenter />
          ) : (
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Reporter</th>
                    <th className="py-3 px-3">Target Content</th>
                    <th className="py-3 px-3">Reason / Details</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-4 px-3 font-mono text-slate-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-space font-bold text-slate-200">@{report.reporterUsername}</span>
                          <span className="text-[9px] font-mono text-slate-500">ID: {report.reporterId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-400">{report.contentTitle || "Untitled Content"}</span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{report.contentType} ({report.contentId})</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-slate-400 max-w-xs truncate" title={report.reason}>
                        {report.reason}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <button
                          onClick={() => {
                            if (!report.isResolved) {
                              handleResolveReport(report.id, "Manually reviewed and cleared by operator.");
                            }
                          }}
                          className={`px-3 py-1 rounded-lg font-bold text-[10px] uppercase transition-all ${
                            report.isResolved 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer"
                          }`}
                        >
                          {report.isResolved ? "RESOLVED" : "MARK RESOLVED"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-600 font-mono italic">
                        No platform abuse reports matching current criteria found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. BADGE MANAGEMENT SYSTEM */}
      {activeSubTab === "badges" && (
        <div className="space-y-6 animate-fadeIn" id="deck-badges-panel">
          
          <div className="flex items-center gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-md mb-6">
            <button
              onClick={() => setBadgeSubSection("clearance")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-space transition-all ${badgeSubSection === "clearance" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Clearance Management
            </button>
            <button
              onClick={() => setBadgeSubSection("catalog")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-space transition-all ${badgeSubSection === "catalog" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Badge Catalog
            </button>
            <button
              onClick={() => setBadgeSubSection("history")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-space transition-all ${badgeSubSection === "history" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Audit History
            </button>
          </div>

          {badgeSubSection === "clearance" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: User Directory Selector (4 cols) */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4 backdrop-blur-md flex flex-col max-h-[750px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-space font-bold text-xs text-white uppercase tracking-wider">
                      Pilih Pengguna Target
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {filteredUsers.length} pengguna terindeks
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-400 font-bold bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/40">
                    Step 1
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari username, nama, email..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 font-mono"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 font-mono text-xs">
                      Tidak ada pengguna yang cocok.
                    </div>
                  ) : (
                    filteredUsers.map((usr) => {
                      const isSelected = inspectedUser?.id === usr.id;
                      const badgeCount = usr.profile?.badges?.length || 0;

                      return (
                        <div
                          key={usr.id}
                          onClick={() => setInspectedUser(usr)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-950/40"
                              : "bg-slate-950/50 border-slate-850 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={usr.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.username}`}
                              alt={usr.username}
                              className="w-9 h-9 rounded-xl border border-slate-800 object-cover bg-slate-900 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-space font-bold text-xs truncate flex items-center gap-1.5">
                                <span>@{usr.username}</span>
                                {usr.role === "SUPER_ADMIN" && (
                                  <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 rounded font-mono font-bold">ROOT</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono truncate">{usr.email}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <RoleBadge role={usr.role} size="xs" />
                            <div className="text-[9px] font-mono text-indigo-400 font-bold">
                              {badgeCount} badge{badgeCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Clearance Console for Target User (8 cols) */}
              <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-md">
                {!inspectedUser ? (
                  <div className="py-24 text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
                      <Key className="w-8 h-8" />
                    </div>
                    <h4 className="font-space font-black text-base text-slate-300 uppercase tracking-wider">
                      Pilih Pengguna untuk Memulai Otorisasi Badge
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
                      Klik salah satu pengguna pada daftar sebelah kiri untuk meninjau badge saat ini dan memberikan (unlock) badge sesuai batas tingkatan kewenangan Anda.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={inspectedUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inspectedUser.username}`}
                          alt={inspectedUser.username}
                          className="w-14 h-14 rounded-2xl border border-indigo-500/30 object-cover bg-slate-900 shadow-md"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-space font-black text-base text-white">
                              {inspectedUser.profile?.fullName || inspectedUser.username}
                            </h4>
                            <span className="text-xs text-indigo-400 font-mono">@{inspectedUser.username}</span>
                            <RoleBadge role={inspectedUser.role} size="sm" />
                          </div>
                          <p className="text-xs text-slate-400 font-sans line-clamp-1">
                            {inspectedUser.profile?.bio || "Warga komunitas NightVerse."}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0 space-y-1 bg-slate-900/80 p-3 rounded-xl border border-slate-850">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">User ID:</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{inspectedUser.id}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Badge yang Saat Ini Dimiliki ({inspectedUser.profile?.badges?.length || 0})
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-950/70 border border-slate-850 rounded-2xl flex flex-wrap gap-2 min-h-[50px] items-center">
                        {(!inspectedUser.profile?.badges || inspectedUser.profile.badges.length === 0) ? (
                          <span className="text-xs font-mono text-slate-600 italic">
                            Pengguna belum memiliki badge khusus tambahan.
                          </span>
                        ) : (
                          inspectedUser.profile.badges.map((bName) => {
                            const badgeDef = allSystemBadges.find(b => b.name.toLowerCase() === bName.toLowerCase() || b.id.toLowerCase() === bName.toLowerCase());
                            const canRevoke = canOperatorGrantBadge(user?.role, badgeDef || { tier: 0 } as any);

                            return (
                              <div
                                key={bName}
                                className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold font-space flex items-center gap-2 shadow-sm"
                              >
                                <span>{bName}</span>
                                {canRevoke && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevokeBadge(inspectedUser.id, bName)}
                                    className="w-4 h-4 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          Katalog Badge & Status Unlock untuk @{inspectedUser.username}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {allSystemBadges.map((b) => {
                          const Icon = getBadgeIconComponent(b.icon);
                          const isAlreadyUnlocked = inspectedUser.profile?.badges?.some(
                            ub => ub.toLowerCase() === b.id.toLowerCase() || ub.toLowerCase() === b.name.toLowerCase()
                          );
                          const hasTierAuthority = canOperatorGrantBadge(user?.role, b);

                          return (
                            <div
                              key={b.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                isAlreadyUnlocked
                                  ? "bg-emerald-950/15 border-emerald-500/30 shadow-md"
                                  : hasTierAuthority
                                  ? "bg-slate-950/80 border-slate-800 hover:border-indigo-500/40"
                                  : "bg-slate-950/30 border-slate-900 opacity-60"
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${b.bgColor || "bg-indigo-500/10"} ${b.color || "text-indigo-400"} border ${b.borderColor || "border-indigo-500/20"}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h5 className="font-space font-bold text-xs text-white leading-tight">{b.name}</h5>
                                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                                        Tier {b.tier} • {b.category}
                                      </span>
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                                    b.tier >= 5 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                                    b.tier >= 4 ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                                    b.tier >= 3 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                                    b.tier >= 2 ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                                    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  }`}>
                                    {b.tier === 5 ? "ROOT ADMIN" : b.tier === 4 ? "ADMIN" : b.tier === 3 ? "MOD" : `TIER ${b.tier}`}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-relaxed">
                                  {b.description}
                                </p>
                              </div>

                              <div className="pt-3 mt-3 border-t border-slate-900 flex items-center justify-between gap-2">
                                {isAlreadyUnlocked ? (
                                  <button
                                    disabled
                                    className="w-full py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-space font-bold text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-default shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>UNLOCKED</span>
                                  </button>
                                ) : !hasTierAuthority ? (
                                  <div className="w-full py-2 bg-slate-900/60 border border-slate-850 text-slate-500 font-mono text-[9px] uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed text-center">
                                    <Lock className="w-3 h-3 text-slate-600" />
                                    <span>
                                      {b.tier >= 4 ? "Memerlukan Super Admin" : "Memerlukan Admin"}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBadgeToUnlock(b.id);
                                      setUnlockBadgeModalOpen(true);
                                    }}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-space font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-900/25 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Key className="w-3 h-3" />
                                    <span>UNLOCK BADGE</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}


          {/* SUB-SECTION 2: BADGE CATALOG & DEFINITIONS */}
          {badgeSubSection === "catalog" && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-space font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" />
                    Katalog Registry Seluruh Badge ({allSystemBadges.length})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Definisi badge resmi platform beserta tingkat kewenangan hierarki (tier) dan persyaratan perolehannya.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allSystemBadges.map((b) => {
                  const Icon = getBadgeIconComponent(b.icon);

                  return (
                    <div
                      key={b.id}
                      className={`p-5 rounded-3xl border ${b.bgColor || "bg-indigo-500/10"} ${b.borderColor || "border-indigo-500/20"} shadow-lg flex flex-col justify-between space-y-4`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-2xl border ${b.borderColor || "border-indigo-500/30"} bg-slate-950/70`}>
                            <Icon className={`w-6 h-6 ${b.color || "text-indigo-400"}`} />
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 uppercase block">
                              Tier {b.tier}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1 block">
                              {b.category}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-space font-black text-base text-white">{b.name}</h4>
                          <span className="text-[10px] font-mono text-indigo-400">ID: {b.id}</span>
                          <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">{b.description}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="text-[10px] text-slate-400 font-sans leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                          <strong className="text-indigo-300 block mb-0.5 font-mono text-[9px] uppercase tracking-wider">Persyaratan:</strong>
                          {b.requirement || "Melalui peninjauan pengelola NightVerse."}
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1">
                          <span>Status: <strong className="text-emerald-400">{b.status}</strong></span>
                          <span>Dibuat: {new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-SECTION 3: AUDIT TRAIL & HISTORY */}
          {badgeSubSection === "history" && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-5 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h4 className="font-space font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Riwayat & Log Pemberian Badge ({allBadgeAwards.length})
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Catatan audit setiap aktivitas pemberian badge kepada pengguna di ekosistem NightVerse.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter penerima, badge, granter..."
                    value={badgeAuditSearch}
                    onChange={(e) => setBadgeAuditSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500 select-none">
                      <th className="py-3 px-3">Waktu & Tanggal</th>
                      <th className="py-3 px-3">Penerima Badge</th>
                      <th className="py-3 px-3">Badge Diberikan</th>
                      <th className="py-3 px-3">Diberikan Oleh</th>
                      <th className="py-3 px-3">Catatan / Alasan</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {allBadgeAwards
                      .filter(a => {
                        if (!badgeAuditSearch.trim()) return true;
                        const q = badgeAuditSearch.toLowerCase();
                        return a.username.toLowerCase().includes(q) ||
                               a.badgeName.toLowerCase().includes(q) ||
                               a.grantedByUsername.toLowerCase().includes(q) ||
                               (a.reason && a.reason.toLowerCase().includes(q));
                      })
                      .map((award) => (
                        <tr key={award.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-3 text-[10px] font-mono text-slate-400">
                            {new Date(award.grantedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-space font-bold text-xs text-indigo-300">
                              @{award.username}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold font-space inline-flex items-center gap-1.5 shadow-sm">
                              <Award className="w-3 h-3 text-indigo-400" />
                              {award.badgeName}
                              <span className="text-[8px] opacity-70 font-mono">T{award.badgeTier}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-slate-300">@{award.grantedByUsername}</span>
                              <RoleBadge role={award.grantedByRole} size="xs" />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-400 font-sans max-w-[200px] truncate" title={award.reason}>
                            {award.reason || "-"}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-mono font-bold">
                              SUCCESS
                            </span>
                          </td>
                        </tr>
                      ))}
                    {allBadgeAwards.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 font-mono italic">
                          Belum ada riwayat aktivitas pemberian badge yang tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}


      {/* 6. SECURITY LOGS & AUDIT TRAIL */}
      {activeSubTab === "security" && (
        <div className="space-y-6" id="deck-security-panel">
          
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <h3 className="text-base font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                  <Shield className="w-5 h-5 text-rose-400 animate-pulse" /> Protected Action Audit trail
                </h3>
                <p className="text-xs text-slate-400 mt-1">This audit timeline serves as a permanent, undeletable ledger of operator actions. Configured via Express backend telemetry hooks.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                   <input 
                     type="text"
                     placeholder="Filter audit logs..."
                     value={logQuery}
                     onChange={(e) => setLogQuery(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs focus:border-rose-500 outline-none"
                   />
                </div>
                <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-black tracking-widest leading-relaxed">SECURE SSE LINKED</span>
              </div>
            </div>
          </div>

            {/* Audit log trail timeline */}
            <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-4 overflow-y-auto max-h-[500px] select-none text-[11px] leading-relaxed font-mono space-y-3.5">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-slate-600 font-mono">No telemetry audits reported to console matching your search.</div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-950 hover:bg-slate-950/80 border border-slate-900/60 rounded-xl relative">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <span className="text-rose-455 font-bold uppercase bg-rose-955/10 border border-rose-500/10 px-2 py-0.5 rounded">Action: {log.action}</span>
                      <span className="text-[10px] text-slate-600 text-right">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>

                    <p className="text-slate-300 mt-1 text-xs">Memo Detail: {log.details}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-[9px] text-slate-500 pt-2 border-t border-slate-900">
                      <span>Operator: <span className="text-slate-400 font-bold">@{log.adminUsername || "System"}</span></span>
                      <span>Category classification: <span className="text-emerald-400 font-bold uppercase">{log.targetType}</span></span>
                      {log.targetId && <span>Filing Target Ref: <span className="slate-400 font-mono">{log.targetId}</span></span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Suspicious Activities warning alerts */}
            <div className="p-4 bg-yellow-950/15 border border-yellow-800/20 text-yellow-350 rounded-2xl flex gap-3 text-xs leading-relaxed">
              <ShieldAlert className="w-7 h-7 text-yellow-400 flex-shrink-0" />
              <div>
                <span className="font-extrabold uppercase text-[10.5px] block font-mono">Simulated Brute-Force login safeguards:</span>
                "Platform watches active session IPs. If a username experiences more than 5 faulty authentication challenges in sequence, our backend logs anomalous indicators and temporary disables authorization channels."
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 7. SYSTEM VARIABLES CONFIG */}
      {activeSubTab === "settings" && (
        <div className="space-y-6" id="deck-settings-panel">
          
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6">
            
            <div className="border-b border-slate-900 pb-4">
              <h3 className="text-base font-extrabold font-space text-slate-100 flex items-center gap-1.5">
                <Settings className="w-5 h-5 text-purple-400" /> Platform System Settings
              </h3>
              <p className="text-xs text-slate-400 mt-1">Directly configure core platform parameters, mailing coordinates, asset upload bounds, website names, and SEO titles without editing source files.</p>
            </div>

            {/* MEDIA APPROVAL SETTINGS (Content Publishing Approval) */}
            <div className="p-6 bg-slate-900/50 border border-slate-850 rounded-2xl md:rounded-3xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 font-black border-l-2 border-purple-500 pl-2">
                      Media Approval Workflow
                    </span>
                    {user.role === "SUPER_ADMIN" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Super Admin Authorized
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Super Admin Clearance Only
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black font-space text-slate-100 mt-1 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Media Approval Settings
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                    Konfigurasi alur persetujuan publikasi konten baru. Pengaturan ini hanya berlaku untuk 3 jenis konten: <strong>Photo</strong>, <strong>Video</strong>, dan <strong>Blog</strong>.
                  </p>
                </div>

                {/* Super Admin Quick Actions */}
                {user.role === "SUPER_ADMIN" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleAllMediaApproval(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      title="Set all 3 media types to Automatic Publishing"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Enable All (Auto)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllMediaApproval(false)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      title="Set all 3 media types to Manual Approval"
                    >
                      <Lock className="w-3 h-3" /> Require All (Manual)
                    </button>
                  </div>
                )}
              </div>

              {/* 3 Content Cards: Photo, Video, Blog */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. PHOTO */}
                {(() => {
                  const isPhotoAuto = localSettings.mediaApproval?.photo ?? true;
                  return (
                    <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isPhotoAuto 
                        ? 'bg-slate-950/80 border-emerald-500/30 shadow-lg shadow-emerald-950/10' 
                        : 'bg-slate-950/80 border-amber-500/30 shadow-lg shadow-amber-950/10'
                    }`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isPhotoAuto ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 font-bold block">1. Photo</span>
                              <h5 className="font-extrabold text-sm text-slate-100">Photo Content</h5>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black uppercase text-slate-400">
                              {isPhotoAuto ? "ON" : "OFF"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isPhotoAuto}
                              onClick={() => handleMediaApprovalToggle("photo")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isPhotoAuto ? 'bg-emerald-500' : 'bg-slate-800'
                              } ${user.role !== "SUPER_ADMIN" ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                              title={user.role !== "SUPER_ADMIN" ? "Only Super Admin can change this setting" : `Click to toggle Photo approval`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isPhotoAuto ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Status Label (Exact requirement) */}
                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          isPhotoAuto 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isPhotoAuto ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                          <span className="font-mono text-[11px] font-black uppercase tracking-tight">
                            {isPhotoAuto ? "Automatic Publishing Enabled" : "Manual Approval Required"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {isPhotoAuto 
                            ? "Konten foto yang diunggah pengguna langsung dipublikasikan (Published) secara otomatis tanpa menunggu persetujuan admin." 
                            : "Konten foto yang diunggah pengguna berstatus Pending dan harus menunggu persetujuan Super Admin di Approval Queue sebelum dipublikasikan."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>New uploads only</span>
                        <span className={isPhotoAuto ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {isPhotoAuto ? "Direct to Feed" : "Approval Queue"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. VIDEO */}
                {(() => {
                  const isVideoAuto = localSettings.mediaApproval?.video ?? false;
                  return (
                    <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isVideoAuto 
                        ? 'bg-slate-950/80 border-emerald-500/30 shadow-lg shadow-emerald-950/10' 
                        : 'bg-slate-950/80 border-amber-500/30 shadow-lg shadow-amber-950/10'
                    }`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isVideoAuto ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <Video className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 font-bold block">2. Video</span>
                              <h5 className="font-extrabold text-sm text-slate-100">Video Content</h5>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black uppercase text-slate-400">
                              {isVideoAuto ? "ON" : "OFF"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isVideoAuto}
                              onClick={() => handleMediaApprovalToggle("video")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isVideoAuto ? 'bg-emerald-500' : 'bg-slate-800'
                              } ${user.role !== "SUPER_ADMIN" ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                              title={user.role !== "SUPER_ADMIN" ? "Only Super Admin can change this setting" : `Click to toggle Video approval`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isVideoAuto ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Status Label (Exact requirement) */}
                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          isVideoAuto 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isVideoAuto ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                          <span className="font-mono text-[11px] font-black uppercase tracking-tight">
                            {isVideoAuto ? "Automatic Publishing Enabled" : "Manual Approval Required"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {isVideoAuto 
                            ? "Konten video yang diunggah pengguna langsung dipublikasikan (Published) secara otomatis tanpa menunggu persetujuan admin." 
                            : "Konten video yang diunggah pengguna berstatus Pending dan harus menunggu persetujuan Super Admin di Approval Queue sebelum dipublikasikan."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>New uploads only</span>
                        <span className={isVideoAuto ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {isVideoAuto ? "Direct to Feed" : "Approval Queue"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. BLOG */}
                {(() => {
                  const isBlogAuto = localSettings.mediaApproval?.blog ?? true;
                  return (
                    <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isBlogAuto 
                        ? 'bg-slate-950/80 border-emerald-500/30 shadow-lg shadow-emerald-950/10' 
                        : 'bg-slate-950/80 border-amber-500/30 shadow-lg shadow-amber-950/10'
                    }`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isBlogAuto ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-slate-500 font-bold block">3. Blog</span>
                              <h5 className="font-extrabold text-sm text-slate-100">Blog Content</h5>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-black uppercase text-slate-400">
                              {isBlogAuto ? "ON" : "OFF"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isBlogAuto}
                              onClick={() => handleMediaApprovalToggle("blog")}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isBlogAuto ? 'bg-emerald-500' : 'bg-slate-800'
                              } ${user.role !== "SUPER_ADMIN" ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                              title={user.role !== "SUPER_ADMIN" ? "Only Super Admin can change this setting" : `Click to toggle Blog approval`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isBlogAuto ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Status Label (Exact requirement) */}
                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          isBlogAuto 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        }`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isBlogAuto ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                          <span className="font-mono text-[11px] font-black uppercase tracking-tight">
                            {isBlogAuto ? "Automatic Publishing Enabled" : "Manual Approval Required"}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {isBlogAuto 
                            ? "Konten blog yang diunggah pengguna langsung dipublikasikan (Published) secara otomatis tanpa menunggu persetujuan admin." 
                            : "Konten blog yang diunggah pengguna berstatus Pending dan harus menunggu persetujuan Super Admin di Approval Queue sebelum dipublikasikan."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-900/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>New uploads only</span>
                        <span className={isBlogAuto ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {isBlogAuto ? "Direct to Feed" : "Approval Queue"}
                        </span>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Informational Policy Banner */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-850 rounded-xl flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Kebijakan persetujuan ini tersimpan permanen di database dan divalidasi backend untuk setiap unggahan baru.</span>
                </div>
                <span className="text-slate-500">Konten terdahulu tidak terpengaruh oleh perubahan toggle.</span>
              </div>

            </div>

            {/* FAVICON MANAGEMENT SECTION */}
            <div className="p-6 bg-slate-900/50 border border-slate-850 rounded-2xl md:rounded-3xl space-y-6" id="favicon-management-panel">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-black border-l-2 border-cyan-400 pl-2">
                      Website Identity & Branding
                    </span>
                    {user.role === "SUPER_ADMIN" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Super Admin Authorized
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Super Admin Clearance Only
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-black font-space text-slate-100 mt-1 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Favicon Management (Ikon Website)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                    Ganti ikon tab browser dan bookmark website secara langsung tanpa modifikasi kode manual. Format didukung: <strong>.ico</strong>, <strong>.png</strong>, dan <strong>.svg</strong> (maks. 2MB).
                  </p>
                </div>

                {/* Reset to Default Action */}
                {user.role === "SUPER_ADMIN" && (
                  <button
                    type="button"
                    onClick={handleResetFaviconToDefault}
                    disabled={isResettingFavicon || isSavingFavicon}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-mono font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 disabled:opacity-50"
                    title="Kembalikan favicon ke default NightVerse"
                    id="btn-reset-favicon"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResettingFavicon ? "animate-spin text-purple-400" : "text-slate-400"}`} />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              {/* Main Grid: Upload Staging & Live Browser Tab Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Upload Box (col 12 -> 5) */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <label className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                      1. Unggah File Favicon Baru
                    </label>
                    
                    {/* Drop / Select Zone */}
                    <div className={`p-5 rounded-2xl border-2 border-dashed transition-all relative ${
                      user.role !== "SUPER_ADMIN"
                        ? "border-slate-850 bg-slate-950/40 opacity-60 cursor-not-allowed"
                        : stagedFaviconFile 
                          ? "border-cyan-500/60 bg-cyan-950/10 shadow-lg shadow-cyan-950/20"
                          : "border-slate-800 hover:border-purple-500/50 bg-slate-950/60"
                    }`}>
                      <input
                        type="file"
                        id="favicon-upload-input"
                        accept=".ico,.png,.svg,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                        disabled={user.role !== "SUPER_ADMIN" || isSavingFavicon || isResettingFavicon}
                        onChange={handleFaviconFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                      />
                      <div className="flex flex-col items-center justify-center text-center space-y-2.5 py-3 pointer-events-none">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          stagedFaviconFile ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-slate-900 text-purple-400 border border-slate-800"
                        }`}>
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">
                            {stagedFaviconFile ? stagedFaviconFile.name : "Klik atau seret file ke sini untuk mengunggah"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Dukungan format: .ICO, .PNG, .SVG (Maks. 2MB)
                          </p>
                        </div>
                        {stagedFaviconFile && (
                          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                            {(stagedFaviconFile.size / 1024).toFixed(1)} KB • Siap disimpan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requirements Pill list */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-center">
                      <div className="p-2 bg-slate-950/80 border border-slate-850 rounded-xl">
                        <span className="text-slate-500 block">FORMAT</span>
                        <strong className="text-purple-300">.ICO, .PNG, .SVG</strong>
                      </div>
                      <div className="p-2 bg-slate-950/80 border border-slate-850 rounded-xl">
                        <span className="text-slate-500 block">MAX SIZE</span>
                        <strong className="text-cyan-300">2.0 MB</strong>
                      </div>
                      <div className="p-2 bg-slate-950/80 border border-slate-850 rounded-xl">
                        <span className="text-slate-500 block">CACHE</span>
                        <strong className="text-emerald-300">Auto Busting</strong>
                      </div>
                    </div>
                  </div>

                  {/* Buttons: Save Changes and Cancel */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveFaviconChanges}
                      disabled={!stagedFaviconFile || isSavingFavicon || user.role !== "SUPER_ADMIN"}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-space font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      id="btn-save-favicon"
                    >
                      {isSavingFavicon ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>

                    {stagedFaviconFile && (
                      <button
                        type="button"
                        onClick={handleCancelFaviconStaging}
                        disabled={isSavingFavicon}
                        className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer"
                        id="btn-cancel-favicon"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Simulated Browser Tab & Multi-Scale Inspection (col 12 -> 7) */}
                <div className="lg:col-span-7 space-y-4">
                  <label className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                    2. Live Browser Tab Preview & Inspeksi Skala
                  </label>

                  {/* Simulated Browser Chrome */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Browser Top Bar & Tab */}
                    <div className="bg-slate-900/90 border-b border-slate-850 px-3 pt-2.5 pb-0 flex items-center gap-2">
                      {/* Traffic light dots */}
                      <div className="flex items-center gap-1.5 mr-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                      </div>

                      {/* Active Tab Mockup */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border-t border-x border-slate-800 rounded-t-xl max-w-[260px] text-xs font-sans text-slate-200 select-none shadow-sm relative">
                        {/* Favicon in tab */}
                        <img
                          src={stagedFaviconPreview || systemSettings.faviconUrl || "/favicon.svg"}
                          alt="Favicon Tab Preview"
                          className="w-4 h-4 rounded shrink-0 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/favicon.svg";
                          }}
                        />
                        <span className="truncate text-[11px] font-medium font-sans text-slate-300">
                          {localSettings.websiteName || "NightVerse"} - Live Creator
                        </span>
                        <X className="w-3 h-3 text-slate-600 hover:text-slate-400 ml-auto shrink-0" />
                      </div>

                      {/* Inactive Tab Mockup */}
                      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-slate-500 max-w-[140px] text-xs font-sans select-none opacity-60">
                        <span className="text-[10px] truncate">Dashboard</span>
                      </div>
                    </div>

                    {/* Address bar mockup */}
                    <div className="bg-slate-950 px-4 py-2 border-b border-slate-900 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span className="text-slate-400 font-sans">https://</span>
                      <span className="text-slate-200 font-sans font-semibold">nightverse.live</span>
                      <span className="text-slate-500 font-sans">/explore</span>
                      <span className="ml-auto text-[9px] px-2 py-0.5 rounded bg-slate-900 text-purple-400 border border-slate-850">
                        {stagedFaviconPreview ? "Preview (Unsaved)" : "Active Production"}
                      </span>
                    </div>

                    {/* Multi-Resolution Inspection View */}
                    <div className="p-4 bg-slate-950/70 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      
                      {/* 16x16 */}
                      <div className="p-3 bg-slate-900/60 border border-slate-850/80 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <img
                            src={stagedFaviconPreview || systemSettings.faviconUrl || "/favicon.svg"}
                            alt="16px"
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/favicon.svg";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 block font-bold">16 × 16 px</span>
                          <span className="text-[9px] text-slate-500 truncate block">Browser Tab standard</span>
                        </div>
                      </div>

                      {/* 32x32 */}
                      <div className="p-3 bg-slate-900/60 border border-slate-850/80 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <img
                            src={stagedFaviconPreview || systemSettings.faviconUrl || "/favicon.svg"}
                            alt="32px"
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/favicon.svg";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 block font-bold">32 × 32 px</span>
                          <span className="text-[9px] text-slate-500 truncate block">Retina / Bookmark</span>
                        </div>
                      </div>

                      {/* 64x64 Preview */}
                      <div className="p-3 bg-slate-900/60 border border-slate-850/80 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <img
                            src={stagedFaviconPreview || systemSettings.faviconUrl || "/favicon.svg"}
                            alt="64px"
                            className="w-9 h-9 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/favicon.svg";
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 block font-bold">64 × 64 px</span>
                          <span className="text-[9px] text-slate-500 truncate block">PWA / HiDPI icon</span>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Sync Status Banner */}
                  <div className="p-3 bg-slate-950/50 border border-slate-850/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>
                        URL Aktif: <span className="text-slate-300 font-bold">{systemSettings.faviconUrl || "/favicon.svg"}</span>
                      </span>
                    </div>
                    <span className="text-slate-500">
                      Cache-busting aktif • Tersinkronisasi real-time
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* Settings input forms list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              <div className="space-y-4">
                
                <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400 font-black block border-l-2 border-purple-500 pl-2"> Branded App Aesthetics</span>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">Website Human Title Label</label>
                  <input 
                    type="text"
                    value={localSettings.websiteName || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, websiteName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-purple-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">Header Logo Text Accent</label>
                  <input 
                    type="text"
                    value={localSettings.logoText || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, logoText: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-purple-650 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">Application Logo (Image URL or Upload)</label>
                  <div className="flex items-center gap-2">
                    {localSettings.logoUrl && (
                      <img src={localSettings.logoUrl || undefined} className="w-10 h-10 rounded object-cover border border-slate-800 bg-slate-900" alt="logo preview" />
                    )}
                    <input 
                      type="text"
                      placeholder="Paste remote URL or upload file..."
                      value={localSettings.logoUrl || ""}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-purple-650 text-sm"
                    />
                    <label className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-4 rounded-xl cursor-pointer text-xs font-bold transition-all whitespace-nowrap">
                      Upload File
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">Homepage Hero Headline Text</label>
                  <textarea 
                    value={localSettings.heroTitle || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, heroTitle: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-purple-650"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">Hero Description Subtitle</label>
                  <textarea 
                    value={localSettings.heroSubtitle || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-250 focus:outline-none focus:border-purple-650"
                  />
                </div>

              </div>

              <div className="space-y-4">
                
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-black block border-l-2 border-cyan-400 pl-2">Upload Files bounds & SEO</span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono text-slate-450 block">Max Image limit (MB)</label>
                    <input 
                      type="number"
                      value={localSettings.maxImageSizeMB || ""}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, maxImageSizeMB: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-mono text-slate-450 block">Max Video size limits (MB)</label>
                    <input 
                      type="number"
                      value={localSettings.maxVideoSizeMB || ""}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, maxVideoSizeMB: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">SMTP Relational Mail Host Server</label>
                  <input 
                    type="text"
                    value={localSettings.smtpHost || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">SEO Description Meta</label>
                  <textarea 
                    value={localSettings.seoDescription || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, seoDescription: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-mono text-slate-450 block">Copyright Bottom Footer Text</label>
                  <input 
                    type="text"
                    value={localSettings.footerText || ""}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, footerText: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="pt-2 flex gap-4">
                  
                  {/* Real-time slider toggle checkboxes */}
                  <label className="flex items-center gap-2 cursor-pointer text-slate-350 select-none">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableRealtimeStream || false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, enableRealtimeStream: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Real-time SSE Stream Broadcasts</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-350 select-none">
                    <input 
                      type="checkbox"
                      checked={localSettings.enableEmailVerification || false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, enableEmailVerification: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Email Verification checks</span>
                  </label>

                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <label className="flex items-center gap-3 cursor-pointer text-slate-200 select-none">
                    <input 
                      type="checkbox"
                      checked={localSettings.creatorMasterpiecesBlur || false}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, creatorMasterpiecesBlur: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block font-space text-xs">Creator Masterpieces Blur Effect</span>
                      <span className="text-[10px] text-slate-400 block font-sans mt-0.5">ON: Seluruh media visual pada kartu Curated Creator Masterpieces menjadi blur. OFF: Normal.</span>
                    </div>
                  </label>
                </div>

              </div>

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-900">
              <button 
                onClick={handleSaveWorkspaceSettings}
                className="py-3 px-8 bg-purple-600 hover:bg-purple-500 text-white font-space font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer shadow-lg shadow-purple-900/25 active:scale-95 transition-all flex items-center gap-2"
                id="btn-save-platform-settings"
              >
                <CheckCircle2 className="w-4 h-4" /> COMMIT CORE SETTINGS CHANGES
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 8. DOCUMENTATION CENTER MANAGEMENT */}
      {activeSubTab === "docs" && (
        <div className="space-y-6" id="deck-docs-panel">
          <DocumentationManagement />
        </div>
      )}

      {/* Admin Content Deletion Modal */}
      <DeleteConfirmationModal 
        isOpen={Boolean(contentToDeleteLog)}
        onClose={() => setContentToDeleteLog(null)}
        onConfirm={async () => {
          if (!contentToDeleteLog) return;
          await handleDeleteContent(contentToDeleteLog.contentId, contentToDeleteLog.contentType);
          await handleResolveReport(contentToDeleteLog.id, "Flagged content deleted after platform claim analysis.");
          setContentToDeleteLog(null);
        }}
        title="Permanently Delete Flagged Asset"
        warningText="You are about to irreversibly purge this user asset from the metadata index. This action is permanently destructive and cannot be undone."
        itemDetails={
          contentToDeleteLog ? (
            <div className="flex flex-col gap-1 overflow-hidden">
              <span className="text-sm font-bold text-slate-200">Content ID: {contentToDeleteLog.contentId}</span>
              <span className="text-xs font-mono text-purple-400">Type: {contentToDeleteLog.contentType}</span>
              <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
                <span className="flex items-center gap-1">Reported around {new Date(contentToDeleteLog.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : null
        }
      />

      {/* Admin Tag Deletion Modal */}
      <DeleteConfirmationModal 
        isOpen={bulkTagDeleteModalOpen}
        onClose={() => setBulkTagDeleteModalOpen(false)}
        onConfirm={async () => {
          if (selectedTagsForBulk.length === 0 || !token) return;
          try {
            for (const id of selectedTagsForBulk) {
              const t = tagsStats.find(x => x.id === id);
              if (t) await handleDeleteTagConfirm(id, t.name);
            }
            setSelectedTagsForBulk([]);
            triggerToast("Bulk Purge Complete", `Processed ${selectedTagsForBulk.length} taxonomy entries`, "success");
            loadAllAdminMetrics();
          } catch (err) {
            console.error(err);
            triggerToast("Error", "Bulk delete operation encountered issues", "error");
          } finally {
            setBulkTagDeleteModalOpen(false);
          }
        }}
        title="Permanently Purge Selected Tags"
        warningText={`You are about to irreversibly purge ${selectedTagsForBulk.length} selected tags globally. This will remove all hashtag metadata and associations across the entire system. This action is destructive.`}
        itemDetails={
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Selected hashtags:</span>
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex flex-wrap gap-2">
               {selectedTagsForBulk.map(id => {
                  const tagItem = tagsStats.find(t => t.id === id);
                  return (
                    <span key={id} className="text-[10px] font-mono px-2 py-1 bg-rose-950/30 text-rose-400 border border-rose-900/40 rounded-md">
                      #{tagItem?.name || id}
                    </span>
                  );
               })}
            </div>
            <p className="text-[10px] text-rose-500 font-bold italic mt-2">Recovery is not possible once confirmed.</p>
          </div>
        }
      />


      {tagToPurge && (
        <DeleteConfirmationModal 
          isOpen={true}
          onClose={() => setTagToPurge(null)}
          onConfirm={() => {
            if (tagToPurge) {
               handleHardPurgeTagAsset(tagToPurge.id, tagToPurge.name);
               setTagToPurge(null);
            }
          }}
          title="Move Tag to Purge Vault"
          warningText="Are you sure you want to move this tag to the purge vault?"
        />
      )}

      <DeleteConfirmationModal 
        isOpen={Boolean(tagToDelete)}
        onClose={() => setTagToDelete(null)}
        onConfirm={async () => {
          if (!tagToDelete) return;
          await handleDeleteTagConfirm(tagToDelete.id, tagToDelete.name);
          setTagToDelete(null);
        }}
        title="Permanently Delete Hashtag"
        warningText={`You are about to irreversibly purge the tag #${tagToDelete?.name}. This will prevent any more content from using it, and it will be removed from existing records.`}
        itemDetails={
          tagToDelete ? (
            <div className="flex flex-col gap-1 overflow-hidden">
              <span className="text-sm font-bold text-slate-200">Tag: #{tagToDelete.name}</span>
              <span className="text-xs font-mono text-purple-400">Total Uses: {tagToDelete.count || tagToDelete.usageCount || 0}</span>
              <div className="flex gap-3 text-[10px] text-slate-500 mt-1">
                <span>Created {new Date(tagToDelete.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : null
        }
      />

      {/* Upgraded Unlock Badge Modal */}
      {unlockBadgeModalOpen && inspectedUser && (() => {
        const targetBadge = allSystemBadges.find(b => b.id.toLowerCase() === selectedBadgeToUnlock.toLowerCase() || b.name.toLowerCase() === selectedBadgeToUnlock.toLowerCase());
        const hasPermission = canOperatorGrantBadge(user?.role, targetBadge);
        const Icon = getBadgeIconComponent(targetBadge?.icon);

        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold font-space text-white uppercase tracking-tight">Otorisasi & Unlock Badge</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Pemberian kredensial kepada @{inspectedUser.username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setUnlockBadgeModalOpen(false)} 
                  disabled={isUnlockingBadge}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Target Badge Card Preview */}
                {targetBadge && (
                  <div className={`p-4 rounded-2xl border ${targetBadge.bgColor || "bg-indigo-500/10"} ${targetBadge.borderColor || "border-indigo-500/30"} flex items-center gap-3.5 shadow-md`}>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 shrink-0">
                      <Icon className={`w-6 h-6 ${targetBadge.color || "text-indigo-400"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-space font-black text-sm text-white">{targetBadge.name}</h4>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 uppercase font-bold">
                          Tier {targetBadge.tier} • {targetBadge.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-sans line-clamp-2">{targetBadge.description}</p>
                    </div>
                  </div>
                )}

                {/* Role Permission Check Warning */}
                {!hasPermission && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                    <span>
                      Peringatan: Tingkat role Anda ({user?.role}) tidak memiliki izin untuk memberikan badge Tier {targetBadge?.tier || 0}. Otoritas ditolak oleh sistem.
                    </span>
                  </div>
                )}

                {/* Target User Info */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={inspectedUser.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inspectedUser.username}`} 
                      className="w-7 h-7 rounded-lg border border-slate-800 object-cover" 
                      alt="avatar" 
                    />
                    <span className="text-xs font-bold text-slate-200">Penerima: @{inspectedUser.username}</span>
                  </div>
                  <RoleBadge role={inspectedUser.role} size="xs" />
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                    Alasan / Memo Pemberian (Opsional)
                  </label>
                  <textarea 
                    placeholder="Contoh: Diberikan atas kontribusi portofolio visual dan karya bertema neon..."
                    value={badgeReason}
                    onChange={(e) => setBadgeReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[70px] resize-none"
                  />
                </div>

                {/* Date & Granter */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Tanggal Pemberian</label>
                    <input 
                      type="date"
                      value={badgeDate}
                      onChange={(e) => setBadgeDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Pemberi Kredensial</label>
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-indigo-400 font-mono font-bold truncate">
                      @{user?.username} ({user?.role})
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950/60 border-t border-slate-800 flex gap-3">
                <button 
                  type="button"
                  disabled={isUnlockingBadge}
                  onClick={() => setUnlockBadgeModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  disabled={!hasPermission || isUnlockingBadge}
                  onClick={handleUnlockBadgeSubmit}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-xs uppercase rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUnlockingBadge ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>UNLOCKING...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>CONFIRM & UNLOCK BADGE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Super Admin: Create New Badge Modal */}
      {createBadgeModalOpen && user?.role === "SUPER_ADMIN" && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-space text-white uppercase tracking-tight">Create New Badge Definition</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Super Admin Root Configuration Panel</p>
                </div>
              </div>
              <button onClick={() => setCreateBadgeModalOpen(false)} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBadgeSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Badge ID (Unique Slug)</label>
                  <input
                    type="text"
                    placeholder="e.g. cyber-legend"
                    value={newBadgeForm.id}
                    onChange={(e) => setNewBadgeForm(p => ({ ...p, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Badge Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Cyber Legend"
                    value={newBadgeForm.name}
                    onChange={(e) => setNewBadgeForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none font-space font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Icon</label>
                  <select
                    value={newBadgeForm.icon}
                    onChange={(e) => setNewBadgeForm(p => ({ ...p, icon: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-mono cursor-pointer"
                  >
                    <option value="ShieldCheck">ShieldCheck</option>
                    <option value="ShieldAlert">ShieldAlert</option>
                    <option value="Shield">Shield</option>
                    <option value="CheckCircle2">CheckCircle2</option>
                    <option value="Trophy">Trophy</option>
                    <option value="Crown">Crown</option>
                    <option value="Sparkles">Sparkles</option>
                    <option value="Star">Star</option>
                    <option value="Award">Award</option>
                    <option value="User">User</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Kategori</label>
                  <select
                    value={newBadgeForm.category}
                    onChange={(e) => setNewBadgeForm(p => ({ ...p, category: e.target.value as BadgeCategory }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-mono cursor-pointer"
                  >
                    <option value="COMMUNITY">COMMUNITY</option>
                    <option value="ACHIEVEMENT">ACHIEVEMENT</option>
                    <option value="SPECIAL">SPECIAL</option>
                    <option value="ROLE">ROLE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Tier / Hierarki</label>
                  <select
                    value={newBadgeForm.tier}
                    onChange={(e) => setNewBadgeForm(p => ({ ...p, tier: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none font-mono cursor-pointer"
                  >
                    <option value="5">Tier 5 (Super Admin Only)</option>
                    <option value="4">Tier 4 (Admin Level)</option>
                    <option value="3">Tier 3 (Moderator Level)</option>
                    <option value="2">Tier 2 (Verified Level)</option>
                    <option value="1">Tier 1 (Contributor Level)</option>
                    <option value="0">Tier 0 (VIP / Member)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Color Theme</label>
                <div className="flex flex-wrap gap-2">
                  {["purple", "rose", "cyan", "blue", "emerald", "amber", "fuchsia"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewBadgeForm(p => ({ ...p, colorScheme: c }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold capitalize transition-all border ${
                        newBadgeForm.colorScheme === c
                          ? "bg-slate-800 border-white text-white shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Deskripsi Badge</label>
                <textarea
                  placeholder="Jelaskan arti dan makna dari badge ini..."
                  value={newBadgeForm.description}
                  onChange={(e) => setNewBadgeForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-rose-500 outline-none font-sans resize-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Deskripsi Persyaratan</label>
                <textarea
                  placeholder="Kriteria atau persyaratan yang harus dipenuhi pengguna untuk memperoleh badge ini..."
                  value={newBadgeForm.requirement}
                  onChange={(e) => setNewBadgeForm(p => ({ ...p, requirement: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-rose-500 outline-none font-sans resize-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateBadgeModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-space font-bold uppercase text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-space font-bold uppercase text-xs rounded-xl shadow-lg shadow-rose-900/30 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Simpan & Daftarkan Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Tag View Modal Overlay */}
      {previewTag && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-905 border-b border-slate-800 p-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold font-space text-lg text-slate-100">#{previewTag.name} <span className="text-sm text-slate-500 font-mono">Directory Preview</span></h2>
                <div className="text-xs text-slate-400 font-mono mt-1 space-x-3">
                  <span>Usage: {previewTag.count || previewTag.usageCount || 0} times</span>
                  <span>Origin: {previewTag.mostActiveUsername ? `@${previewTag.mostActiveUsername}` : "Anonymous"}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTag(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
              <div className="space-y-6">
                {/* Find blogs with tag */}
                {allBlogs.filter(b => b.tags && b.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold font-space text-purple-400 uppercase mb-3">Blogs Attached</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allBlogs.filter(b => b.tags && b.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).map(b => (
                        <div key={b.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                          <p className="text-sm font-bold text-slate-200 truncate">{b.title}</p>
                          <p className="text-xs text-slate-500 font-mono mt-1 w-full truncate">By {b.author.username}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Find photos with tag */}
                {allPhotos.filter(p => p.tags && p.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold font-space text-cyan-400 uppercase mb-3">Photos Attached</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {allPhotos.filter(p => p.tags && p.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).map(p => (
                        <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 group">
                          <img src={p.url || undefined} className="w-full h-full object-cover" alt="asset" />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950 to-transparent">
                            <p className="text-[10px] font-bold text-white truncate">{p.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Find videos with tag */}
                {allVideos.filter(v => v.tags && v.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold font-space text-rose-400 uppercase mb-3">Videos Attached</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {allVideos.filter(v => v.tags && v.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).map((v: any) => (
                        <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                          <p className="text-sm font-bold text-slate-200 truncate">{v.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">By {v.author?.username}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {allBlogs.filter(b => b.tags && b.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).length === 0 &&
                 allPhotos.filter(p => p.tags && p.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).length === 0 &&
                 allVideos.filter(v => v.tags && v.tags.map((t: string) => t.toLowerCase()).includes(previewTag.name.toLowerCase())).length === 0 && (
                   <div className="py-12 text-center text-slate-500 font-mono text-sm">
                     No actual content found using this hashtag currently.
                   </div>
                 )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-905 flex justify-end gap-3 sticky bottom-0 z-20 backdrop-blur-md">
               <button
                 onClick={() => {
                   setRenameTagNewWord(previewTag.name);
                   setSelectedTagToMod(previewTag);
                   setPreviewTag(null);
                 }}
                 className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
               >
                 <Edit2 className="w-3.5 h-3.5" /> Edit Tag
               </button>
               <button
                 onClick={() => {
                   setTagToDelete(previewTag);
                   setPreviewTag(null);
                 }}
                 className="px-4 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 transition-all"
               >
                 <Trash2 className="w-3.5 h-3.5" /> Purge Tag
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminWorkspace;
