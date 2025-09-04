import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MainLogo from "@/components/MainLogo";
import LanguageSelector from "@/components/ui/Sidebar/partials/LanguageSelector"
import ThemeToggle from "@/components/ui/Sidebar/partials/ThemeToggle"


interface AuthenticationLayoutProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const AuthenticationLayout: React.FC<AuthenticationLayoutProps> = ({
  title,
  description,
  children,
  footer,
}) => {

  return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
          <div className="absolute top-4 right-4 flex items-center space-x-2">
              <LanguageSelector purpose="page" />
              <ThemeToggle purpose="page" />
          </div>
          <div className="w-full max-w-md">
              <div className="flex justify-center mb-8">
                  <MainLogo />
              </div>

              <Card>
                  <CardHeader>
                      <CardTitle className="text-2xl text-center">{title}</CardTitle>
                      {description && <CardDescription className="text-center">{description}</CardDescription>}
                  </CardHeader>
                  <CardContent>{children}</CardContent>
                  {footer && <CardFooter className="flex justify-center">{footer}</CardFooter>}
              </Card>
          </div>
      </div>
  )
};

export default AuthenticationLayout;