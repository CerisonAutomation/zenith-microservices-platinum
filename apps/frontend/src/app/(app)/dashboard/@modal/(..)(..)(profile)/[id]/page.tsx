import { Dialog, DialogContent } from '@zenith/ui-components';
import { useRouter } from 'next/navigation';
import ProfileCard from '@/components/profile/ProfileCard';

export default function ProfileModal({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ProfileCard profileId={params.id} />
      </DialogContent>
    </Dialog>
  );
}
