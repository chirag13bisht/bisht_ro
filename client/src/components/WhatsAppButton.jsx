import { MessageCircle } from 'lucide-react'; // Ensure lucide-react is installed

export default function WhatsAppButton() {
  const phoneNumber = "919716152713"; // Replace with your number
  const message = "Hello Bisht RO, I have a query regarding...";

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all z-50 hover:scale-110 flex items-center justify-center"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  );
}