import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

const volunteerSchema = z.object({
  organization_type: z.enum(['company', 'individual', 'institute']),
  organization_name: z.string().trim().max(100, 'Organization name must be less than 100 characters').optional(),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  personal_email: z.string().trim().email('Please enter a valid personal email').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  work_email: z.string().trim().email('Please enter a valid work email').max(255, 'Email must be less than 255 characters').optional().or(z.literal('')),
  country: z.string().trim().max(100, 'Country must be less than 100 characters').optional(),
  city: z.string().trim().max(100, 'City must be less than 100 characters').optional(),
  country_code: z.string().min(2, 'Country code is required').max(2, 'Invalid country code'),
  phone_number: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number is too long'),
  linkedin_profile: z.string().trim().url('Please enter a valid LinkedIn URL').max(255, 'LinkedIn URL is too long').optional().or(z.literal('')),
}).refine((data) => data.personal_email || data.work_email, {
  message: 'At least one email (personal or work) is required',
  path: ['work_email'],
});

export default function AddVolunteer() {
  const [organizationType, setOrganizationType] = useState<'company' | 'individual' | 'institute'>('company');
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('IN'); // Default to India
  const [phoneNumber, setPhoneNumber] = useState('');
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Country code data
  const countryCodes = [
    { code: 'IN', name: 'India', dialCode: '+91' },
    { code: 'US', name: 'United States', dialCode: '+1' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
    { code: 'CA', name: 'Canada', dialCode: '+1' },
    { code: 'AU', name: 'Australia', dialCode: '+61' },
    { code: 'DE', name: 'Germany', dialCode: '+49' },
    { code: 'FR', name: 'France', dialCode: '+33' },
    { code: 'JP', name: 'Japan', dialCode: '+81' },
    { code: 'CN', name: 'China', dialCode: '+86' },
    { code: 'BR', name: 'Brazil', dialCode: '+55' },
    { code: 'MX', name: 'Mexico', dialCode: '+52' },
    { code: 'SG', name: 'Singapore', dialCode: '+65' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64' },
    { code: 'ZA', name: 'South Africa', dialCode: '+27' },
    { code: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234' },
    { code: 'KE', name: 'Kenya', dialCode: '+254' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate input
    const validation = volunteerSchema.safeParse({ 
      organization_type: organizationType,
      organization_name: organizationType === 'individual' ? 'Self' : organizationName || undefined,
      name, 
      personal_email: personalEmail || undefined,
      work_email: workEmail || undefined,
      country: country || undefined,
      city: city || undefined,
      country_code: countryCode,
      phone_number: phoneNumber,
      linkedin_profile: linkedinProfile || undefined
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('volunteers').insert({
        organization_type: validation.data.organization_type,
        organization_name: validation.data.organization_type === 'individual' ? 'Self' : validation.data.organization_name || null,
        name: validation.data.name,
        personal_email: validation.data.personal_email || null,
        work_email: validation.data.work_email || null,
        country: validation.data.country || null,
        city: validation.data.city || null,
        country_code: validation.data.country_code,
        phone_number: validation.data.phone_number,
        linkedin_profile: validation.data.linkedin_profile || null,
        is_active: true,
      });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('A volunteer with this email already exists.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Volunteer added successfully!');
        navigate('/volunteers');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/volunteers')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add Volunteer</h1>
            <p className="text-muted-foreground mt-1">
              Add a new volunteer to the system
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Volunteer Details</CardTitle>
            <CardDescription>
              Enter the volunteer's information below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Type */}
              <div className="space-y-2">
                <Label htmlFor="organizationType">Organization Type *</Label>
                <Select
                  value={organizationType}
                  onValueChange={(value: 'company' | 'individual' | 'institute') => {
                    setOrganizationType(value);
                    if (value === 'individual') {
                      setOrganizationName('Self');
                    } else {
                      setOrganizationName('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="institute">Institute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Name - shown for company and institute */}
              {organizationType !== 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    {organizationType === 'company' ? 'Company Name' : 'Institute Name'} *
                  </Label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder={`Enter ${organizationType === 'company' ? 'company' : 'institute'} name`}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Individual - show Self label */}
              {organizationType === 'individual' && (
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-muted-foreground">
                    Self
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalEmail">Personal Email</Label>
                <Input
                  id="personalEmail"
                  type="email"
                  placeholder="Enter personal email address"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workEmail">Work Email</Label>
                <Input
                  id="workEmail"
                  type="email"
                  placeholder="Enter work email address"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  At least one email (personal or work) is required
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Enter country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countryCode">Country Code *</Label>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.dialCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <div className="flex gap-2">
                  <div className="w-24 px-3 py-2 bg-muted rounded-md text-sm font-medium flex items-center">
                    {countryCodes.find(c => c.code === countryCode)?.dialCode}
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
                <Input
                  id="linkedinProfile"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinProfile}
                  onChange={(e) => setLinkedinProfile(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/volunteers')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Adding...' : 'Add Volunteer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
