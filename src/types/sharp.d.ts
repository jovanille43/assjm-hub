// Les exports du package `sharp` ne se résolvent pas avec moduleResolution "bundler".
// On déclare le module pour le typecheck (usage simple : resize/webp/toBuffer).
declare module "sharp";
