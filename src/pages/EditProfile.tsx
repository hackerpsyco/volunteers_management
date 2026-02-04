import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    location: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile from user_profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          bio: data.bio || '',
          location: data.location || '',
        });
        if (data.profile_image_url) {
          setProfileImage(data.profile_image_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async (): Promise<string | null> => {
    if (!profileImageFile || !user?.id) return null;

    try {
      setUploading(true);
      const fileExt = profileImageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, profileImageFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Image upload failed. You can save your profile without an image.');
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Image upload failed. Continuing without image.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      let imageUrl = profileImage;

      // Upload image if a new one was selected
      if (profileImageFile) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // If image upload fails, continue without image
          imageUrl = profileImage;
        }
      }

      // Update or create user profile
      const profilePayload = {
        id: user?.id,
        email: user?.email,
        full_name: profileData.full_name || null,
        phone: profileData.phone || null,
        bio: profileData.bio || null,
        location: profileData.location || null,
        profile_image_url: imageUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      toast.success('Profile updated successfully');
      setProfileImageFile(null);
      navigate(-1);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please ensure the migration has been run on Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImageFile(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
            <p className="text-sm text-muted-foreground">Update your profile information</p>
          </div>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal details and profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Profile Picture</Label>
              <div className="flex items-center gap-4">
                {profileImage ? (
                  <div className="relative">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="h-24 w-24 rounded-lg object-cover border border-border"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="Enter your location"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving || uploading}
              >
                {saving || uploading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
