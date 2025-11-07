"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/ui/navbar";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  FileText,
  Lock,
  Search,
  Upload,
  User,
  UserPlus,
} from "lucide-react";
import { useRef, useState } from "react";

export default function PlayersPage() {
  // Edit profile dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - in real app this would come from API
  const [currentUser, setCurrentUser] = useState({
    username: "levelynup",
    handle: "@levelynup",
    elo: 1184,
    wins: 0,
    losses: 1,
    draws: 0,
    gamesPlayed: 1,
    record: "0W - 1L - 0D",
    winRate: "0%",
    lastActive: "Online",
    bio: "Chess enthusiast and strategy game lover.",
    avatarUrl: null as string | null,
  });

  // Form state
  const [editForm, setEditForm] = useState({
    username: currentUser.username,
    bio: currentUser.bio,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const friends = [
    {
      username: "joebeez",
      handle: "@joebeez",
      elo: 1215,
      record: "2W - 1L - 0D",
      winRate: "67%",
      lastActive: "2h ago",
    },
  ];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      username: currentUser.username,
      bio: currentUser.bio,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setAvatarPreview(currentUser.avatarUrl);
    setShowPasswordSection(false);
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    // Validate password fields if user is changing password
    if (editForm.newPassword) {
      if (editForm.newPassword !== editForm.confirmPassword) {
        alert("New passwords don't match!");
        return;
      }
      if (!editForm.currentPassword) {
        alert("Please enter your current password to change it.");
        return;
      }
    }

    // In real app, this would call API to update profile
    setCurrentUser({
      ...currentUser,
      username: editForm.username,
      handle: `@${editForm.username}`,
      bio: editForm.bio,
      avatarUrl: avatarPreview,
    });

    // Reset form
    setIsEditDialogOpen(false);
    setAvatarFile(null);
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar username="levelynup" elo={1184} />

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Players</h1>
          <p className="text-sm text-muted-foreground">
            Your profile and friends
          </p>
        </div>

        {/* Current User Profile */}
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Your Profile</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleEditProfile}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                {currentUser.avatarUrl && (
                  <AvatarImage
                    src={currentUser.avatarUrl}
                    alt={currentUser.username}
                  />
                )}
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {currentUser.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {currentUser.username}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                    {currentUser.lastActive}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentUser.handle}
                </p>
                {currentUser.bio && (
                  <p className="text-sm text-foreground mt-2 max-w-md">
                    {currentUser.bio}
                  </p>
                )}
              </div>
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold">{currentUser.elo}</div>
                <div className="text-xs text-muted-foreground">ELO Rating</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Games Played
                </div>
                <div className="font-semibold">{currentUser.gamesPlayed}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Wins</div>
                <div className="font-semibold text-green-600">
                  {currentUser.wins}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Losses</div>
                <div className="font-semibold text-red-600">
                  {currentUser.losses}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="font-semibold">{currentUser.winRate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Friends Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Friends</CardTitle>
                <CardDescription className="mt-1">
                  {friends.length} {friends.length === 1 ? "friend" : "friends"}
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search friends..." className="pl-9" />
            </div>

            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.username}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="font-semibold">
                      {friend.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">
                        {friend.username}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {friend.lastActive}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {friend.handle}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold">{friend.elo}</div>
                    <div className="text-xs text-muted-foreground">
                      {friend.winRate}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Challenge
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information, avatar, and password
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Profile Picture
                </Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    {(avatarPreview || currentUser.avatarUrl) && (
                      <AvatarImage
                        src={
                          avatarPreview || currentUser.avatarUrl || undefined
                        }
                        alt="Preview"
                      />
                    )}
                    <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                      {editForm.username[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPG, PNG or GIF. Max size 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  placeholder="Enter username"
                />
              </div>

              {/* Biography */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Biography{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {editForm.bio.length}/200 characters
                </p>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-border">
                {!showPasswordSection ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 w-full"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    <Lock className="h-4 w-4" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <h3 className="font-semibold">Change Password</h3>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setEditForm({
                            ...editForm,
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={editForm.currentPassword}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            currentPassword: e.target.value,
                          })
                        }
                        placeholder="Enter current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={editForm.newPassword}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={editForm.confirmPassword}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
