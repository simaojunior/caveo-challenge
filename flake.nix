{
  description = "Simple Node.js + pnpm + Terraform development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # Easy version management for Node.js and pnpm
        nodejs = pkgs.nodejs_22; # Change to nodejs_18, nodejs_20, etc.
        pnpm = pkgs.nodePackages.pnpm.override { inherit nodejs; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            nodejs
            pnpm
            pkgs.opentofu # OpenTofu is a community-driven fork of Terraform
          ];

          shellHook = ''
            echo "Development environment ready!"
            echo "Node.js: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo "OpenTofu: $(tofu --version | head -n1)"
          '';
        };
      });
}

