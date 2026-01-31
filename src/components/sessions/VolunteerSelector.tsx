import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Volunteer {
  id: string;
  name: string;
  personal_email: string;
  work_email: string;
  phone_number: string;
  organization_name: string;
}

interface VolunteerSelectorProps {
  volunteers: Volunteer[];
  selectedVolunteer: string;
  onSelectVolunteer: (volunteerId: string, volunteerName: string) => void;
  placeholder?: string;
}

export function VolunteerSelector({
  volunteers,
  selectedVolunteer,
  onSelectVolunteer,
  placeholder = 'Select a volunteer...',
}: VolunteerSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedVolunteerData = volunteers.find(v => v.id === selectedVolunteer);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm sm:text-base"
        >
          {selectedVolunteerData
            ? `${selectedVolunteerData.name} (${selectedVolunteerData.organization_name || 'N/A'})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput placeholder="Search by name, organization, or email..." />
          <CommandEmpty>No volunteer found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {volunteers.map((volunteer) => (
                <CommandItem
                  key={volunteer.id}
                  value={`${volunteer.name} ${volunteer.organization_name || ''} ${volunteer.work_email || ''} ${volunteer.personal_email || ''}`}
                  onSelect={() => {
                    onSelectVolunteer(volunteer.id, volunteer.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedVolunteer === volunteer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{volunteer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {volunteer.organization_name || 'N/A'} • {volunteer.work_email || volunteer.personal_email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
