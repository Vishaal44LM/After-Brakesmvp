import Preloader from "@/components/Preloader";

// Temporary holding mode: the app stops at the logo-only preloader.
// onComplete is a no-op so the preloader never hands off to any screen.
const Index = () => <Preloader onComplete={() => {}} />;

export default Index;
