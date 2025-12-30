# GCP IAM Explorer

An interactive, visual playground for understanding Google Cloud Identity and Access Management (IAM). This tool helps DevOps engineers and architects visualize how policies flow through the GCP resource hierarchy, from Organizations down to individual Service Accounts.

## 🚀 Overview

GCP IAM is complex due to inheritance, effective permissions, and specialized policy types (Deny, Conditions). This explorer simplifies these concepts through interactive scenarios and a real-time visualization canvas.

## ✨ Features

- **Hierarchical Visualization**: A tree-like canvas powered by D3.js representing the `Org > Folder > Project > Resource` hierarchy.
- **Interactive Scenarios**:
  - **Deep Inheritance**: Watch roles flow down through multiple folder layers.
  - **Service Accounts**: Understand the "Act As" relationship and how Service Accounts function as both identities and resources.
  - **IAM Deny Policies**: Visualize how Deny rules override Allow rules regardless of hierarchy level.
  - **IAM Conditions**: See time-bound and attribute-based access in action.
- **Policy Diff Engine**: A code-pane that shows the exact JSON policy changes (Before vs. After) to help you learn `gcloud` and Terraform configurations.
- **AI-Powered Insights**: Integrated with Google Gemini to provide architectural analysis and security implications for every change.

## 🛠 How it Works

1. **The Canvas**: Uses a d3-force simulation with vertical constraints to maintain a clear visual hierarchy.
2. **Policy Simulation**: Tracks a virtual state of IAM bindings. When you click "Apply Action," the app calculates the resulting policy.
3. **Identity Details**: Select any node to see its effective access status and metadata.

## 📖 How to Use

1. **Select a Scenario**: Use the top navigation bar to choose a concept you want to explore.
2. **Inspect the Hierarchy**: Drag and click nodes in the canvas to see resource IDs and identity details.
3. **Toggle Actions**: Click the primary action button (e.g., "Grant Folder Viewer") to see the IAM link appear and the policy update.
4. **Read the Diff**: Observe the highlighted lines in the right-hand JSON pane to see how the policy structure changes.
5. **Analyze**: Check the "Architect Analysis" box for AI-generated security summaries.

## 📦 Self-Deployment

This is a static React application that can be deployed to any web host (Firebase Hosting, GitHub Pages, Vercel, etc.).

### Prerequisites
- A Google Gemini API Key (for the Architect Analysis feature).

### Local Development
1. Clone the repository.
2. Ensure you have a local server that supports ES modules (like Vite or Live Server).
3. The application expects an environment variable `API_KEY` to be available.
4. Open `index.html` in your browser.

### Environment Configuration
The app uses the Gemini API. Ensure your deployment environment has the `API_KEY` set.

```json
{
  "API_KEY": "your_gemini_api_key_here"
}
```

## 🛡 Security Note
This tool is for **educational purposes only**. It simulates IAM behaviors to help users learn. Always verify your actual production policies using the [GCP IAM Policy Analyzer](https://cloud.google.com/iam/docs/analyzing-iam-policies).

---
*Built with React, D3.js, Tailwind CSS, and Google Gemini.*