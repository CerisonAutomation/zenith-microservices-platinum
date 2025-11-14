"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface CarouselContextProps {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  itemsCount: number;
}

const CarouselContext = React.createContext<CarouselContextProps | undefined>(
  undefined
);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a Carousel");
  }
  return context;
}

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ children, className }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [itemsCount, setItemsCount] = React.useState(0);

    React.useEffect(() => {
      const items = React.Children.toArray(children).filter(
        (child) =>
          React.isValidElement(child) && child.type === CarouselContent
      );
      if (items.length > 0) {
        const content = items[0] as React.ReactElement;
        const count = React.Children.count(content.props.children);
        setItemsCount(count);
      }
    }, [children]);

    return (
      <CarouselContext.Provider
        value={{ currentIndex, setCurrentIndex, itemsCount }}
      >
        <div ref={ref} className={cn("relative", className)}>
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

interface CarouselContentProps {
  children: React.ReactNode;
  className?: string;
}

const CarouselContent = React.forwardRef<HTMLDivElement, CarouselContentProps>(
  ({ children, className }, ref) => {
    const { currentIndex } = useCarousel();

    return (
      <div ref={ref} className={cn("overflow-hidden", className)}>
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {children}
        </div>
      </div>
    );
  }
);
CarouselContent.displayName = "CarouselContent";

interface CarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("min-w-full flex-shrink-0", className)}
      >
        {children}
      </div>
    );
  }
);
CarouselItem.displayName = "CarouselItem";

interface CarouselPreviousProps {
  className?: string;
}

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  CarouselPreviousProps
>(({ className }, ref) => {
  const { currentIndex, setCurrentIndex, itemsCount } = useCarousel();

  const handlePrevious = () => {
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : itemsCount - 1);
  };

  return (
    <button
      ref={ref}
      onClick={handlePrevious}
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md hover:bg-white transition-colors",
        className
      )}
      aria-label="Previous slide"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

interface CarouselNextProps {
  className?: string;
}

const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselNextProps>(
  ({ className }, ref) => {
    const { currentIndex, setCurrentIndex, itemsCount } = useCarousel();

    const handleNext = () => {
      setCurrentIndex(currentIndex < itemsCount - 1 ? currentIndex + 1 : 0);
    };

    return (
      <button
        ref={ref}
        onClick={handleNext}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md hover:bg-white transition-colors",
          className
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }
);
CarouselNext.displayName = "CarouselNext";

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
