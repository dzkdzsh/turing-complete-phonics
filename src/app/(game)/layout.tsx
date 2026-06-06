import VideoBg from '@/components/VideoBg';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full">
      <VideoBg />
      <div className="relative h-full" style={{ zIndex: 1 }}>{children}</div>
    </div>
  );
}
