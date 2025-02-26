declare module "react-native-work-manager" {
  export function registerPeriodicTask(
    taskId: string,
    task: any,
    options?: any
  ): Promise<void>;
  export function cancelTask(taskId: string): Promise<void>;
  export function start(): Promise<void>;
  export function stop(): Promise<void>;
  // Add other methods as needed
}
