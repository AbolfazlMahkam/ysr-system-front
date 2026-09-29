import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ScrollToTopProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScrollToTop({ containerRef }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      setVisible(container.scrollTop > 300);
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      variant="destructive"
      size="icon"
      className={cn(
        "fixed bottom-6 left-6 z-50 rounded-md shadow-lg transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
      onClick={scrollToTop}
      aria-label="بازگشت به بالا"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  );
}
