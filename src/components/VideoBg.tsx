const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260602_150901_c45b90ec-18d7-42ff-90e2-b95d7109e330.mp4';

export default function VideoBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={VIDEO_URL}
      />
      {/* Match homepage gradient: dark edges, transparent middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f0d0a]/70 via-transparent to-[#0f0d0a]/90" />
    </div>
  );
}
