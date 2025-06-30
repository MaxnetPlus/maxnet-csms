import * as React from "react";
import { cn } from "@/lib/utils";

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
    ({ className, ...props }, ref) => {
        return (
            <form
                ref={ref}
                className={cn("space-y-6", className)}
                {...props}
            />
        );
    }
);
Form.displayName = "Form";

interface FormFieldProps {
    children: React.ReactNode;
    className?: string;
}

const FormField = ({ children, className }: FormFieldProps) => {
    return (
        <div className={cn("space-y-2", className)}>
            {children}
        </div>
    );
};

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
    ({ className, required, children, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                    className
                )}
                {...props}
            >
                {children}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>
        );
    }
);
FormLabel.displayName = "FormLabel";

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
    type?: "error" | "description";
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
    ({ className, type = "error", children, ...props }, ref) => {
        if (!children) return null;

        return (
            <p
                ref={ref}
                className={cn(
                    "text-sm",
                    type === "error" && "text-destructive",
                    type === "description" && "text-muted-foreground",
                    className
                )}
                {...props}
            >
                {children}
            </p>
        );
    }
);
FormMessage.displayName = "FormMessage";

export { Form, FormField, FormLabel, FormMessage };
