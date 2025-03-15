// Third-party imports
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Local imports
import { login } from "@/api/auth-apis";

export const AUTH_QUERY_KEY = ["auth"];

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      login(credentials.email, credentials.password),
    onSuccess: (data) => {
      // Save the auth data to the query cache
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
    onError: (error) => {
      console.error(error);
    },
  });

  return { loginMutation };
};
