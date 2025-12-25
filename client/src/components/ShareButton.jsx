import { Share2 } from 'lucide-react';

export default function ShareButton() {
  const handleShare = async () => {
    const shareData = {
      title: 'Bisht RO Services',
      text: 'Check out Bisht RO for fast and reliable RO repair!',
      url: window.location.origin, // Sends the current website link
    };

    // Use the native mobile share menu if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      // Fallback for laptops
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.origin);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 hover:bg-blue-700"
      aria-label="Share App"
    >
      <Share2 size={24} />
    </button>
  );
}