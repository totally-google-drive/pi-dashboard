# GitHub Repository Setup Guide

This guide will help you create a GitHub repository for the Pi Dashboard project and set up all the necessary configurations.

## 📋 Prerequisites

Before starting, make sure you have:
- A [GitHub account](https://github.com/)
- Git installed on your system
- GitHub CLI (optional but recommended)

## 🚀 Step 1: Create a New Repository on GitHub

### Method 1: Using GitHub Website

1. Go to [GitHub](https://github.com/new) and click "New repository"
2. Enter repository details:
   - **Repository name**: `pi-dashboard`
   - **Description**: "Raspberry Pi System Monitor - Real-time monitoring and Docker management"
   - **Public/Private**: Choose based on your needs
   - **Initialize with README**: ✅ Check this box
   - **Add .gitignore**: Choose "Python"
   - **License**: Choose "MIT License"
3. Click "Create repository"

### Method 2: Using GitHub CLI

```bash
gh repo create pi-dashboard \
  --description "Raspberry Pi System Monitor - Real-time monitoring and Docker management" \
  --public \
  --push \
  --source=. \
  --remote=upstream
```

## 🔑 Step 2: Connect Your Local Repository to GitHub

### Initialize Git (if not already done)

```bash
cd /home/yoforduder/claud/pi-dashboard

# Initialize git repository
git init

# Add all files
git add .

# Commit initial files
git commit -m "Initial commit: Pi Dashboard with security fixes"
```

### Connect to GitHub

1. **Get your GitHub repository URL** (HTTPS or SSH)
2. **Add remote**:
   ```bash
   git remote add origin https://github.com/yourusername/pi-dashboard.git
   # OR for SSH
   git remote add origin git@github.com:yourusername/pi-dashboard.git
   ```

3. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

## 🔧 Step 3: Set Up GitHub Actions

The repository includes GitHub Actions workflows for:
- **Python CI**: Linting and syntax checking
- **Security Scan**: Regular security scanning with Bandit

These are automatically set up in the `.github/workflows/` directory.

### Verify Workflows

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. You should see:
   - "Python CI" workflow
   - "Security Scan" workflow

## 📝 Step 4: Configure Repository Settings

### Branch Protection

1. Go to **Settings** > **Branches**
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Require status checks to pass
   - ✅ Include workflows from `.github/workflows/`
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings

### Environment Variables (Secrets)

For future enhancements, you may need to add secrets:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Click "New repository secret"
3. Add any required secrets (not needed for current setup)

### Code Owners

1. Create a `CODEOWNERS` file in `.github/`:
   ```
   # Code Owners
   * @yourusername
   ```

## 📊 Step 5: Set Up Project Management

### Projects (Optional)

1. Go to **Projects** > **New project**
2. Choose "Table" view
3. Create columns:
   - To Do
   - In Progress
   - Review
   - Done

### Issues and Labels

The repository includes issue templates in `.github/ISSUE_TEMPLATE/`. These will automatically appear when creating new issues.

#### Default Labels

GitHub automatically creates some labels. You can add more:

1. Go to **Issues** > **Labels** > **New label**
2. Add these labels:
   - `bug` - Red
   - `enhancement` - Purple
   - `documentation` - Green
   - `good first issue` - Green
   - `help wanted` - Blue
   - `wip` - Yellow

## 📈 Step 6: Set Up Repository Insights

### Wiki (Optional)

1. Go to **Wiki** > **Create the first page**
2. Add documentation for:
   - Installation guide
   - Configuration
   - Troubleshooting
   - FAQ

### Discussions (Optional)

1. Go to **Settings** > **Features**
2. Enable "Discussions"
3. Create categories:
   - Q&A
   - Show and tell
   - Feature requests
   - General

## 🔒 Step 7: Security Settings

### Dependency Graph

1. Go to **Insights** > **Dependency graph**
2. Enable dependency scanning

### Code Scanning

1. Go to **Security** > **Code scanning**
2. Set up code scanning (uses GitHub Actions)

### Secret Scanning

GitHub automatically scans for secrets in:
- Commits
- Pull requests
- Issues

## 📢 Step 8: Enable Social Features

### Repository Topics

1. Go to **About** section of your repository
2. Add topics:
   - raspberry-pi
   - monitoring
   - docker
   - flask
   - python
   - system-monitoring
   - web-dashboard

### Social Preview

1. Go to **Settings** > **Pages**
2. Enable GitHub Pages (if you want a project site)
3. Choose branch: `gh-pages`

## 🤖 Step 9: Set Up Automations

### Stale Issues and PRs

1. Go to **Settings** > **Branches** > **Automated repository management**
2. Enable:
   - ✅ Close stale issues
   - ✅ Close stale pull requests
3. Configure:
   - Days before marking as stale: 30
   - Days before closing: 7

### Auto-merge (Optional)

1. Go to **Settings** > **Merge button**
2. Enable auto-merge for dependabot and specific branches

## 📖 Step 10: Create Documentation

### README.md

The repository already has a comprehensive README.md. Make sure to:
1. Replace placeholder links with actual links
2. Update author information
3. Add project screenshots
4. Link to live demo (if available)

### CONTRIBUTING.md

Create a contributing guide:

```markdown
# Contributing to Pi Dashboard

Thank you for considering contributing to Pi Dashboard!

## How to Contribute

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Code Standards

- Follow PEP 8 style guide
- Write clear commit messages
- Add tests for new features
- Update documentation

## Reporting Issues

- Use the issue templates
- Include reproduction steps
- Provide environment details
```

## 🎯 Step 11: Final Checks

### Verify Everything Works

```bash
# Check git status
git status

# Check remote
git remote -v

# Push all changes
git push -u origin main
```

### Test GitHub Features

1. ✅ Repository created
2. ✅ Files pushed
3. ✅ Actions running
4. ✅ Issues templates available
5. ✅ Branch protection enabled
6. ✅ Topics added
7. ✅ README looks good

## 🚀 Step 12: Share Your Project

### Add a README Badges

Add these badges to your README:

```markdown
[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Status](https://github.com/yourusername/pi-dashboard/actions/workflows/python-app.yml/badge.svg)](https://github.com/yourusername/pi-dashboard/actions)
[![Security Scan](https://github.com/yourusername/pi-dashboard/actions/workflows/security-scan.yml/badge.svg)](https://github.com/yourusername/pi-dashboard/actions)
[![GitHub Issues](https://img.shields.io/github/issues/yourusername/pi-dashboard)](https://github.com/yourusername/pi-dashboard/issues)
[![GitHub Stars](https://img.shields.io/github/stars/yourusername/pi-dashboard)](https://github.com/yourusername/pi-dashboard/stargazers)
```

### Share on Social Media

```bash
# Create a tweet
Tweet: "Just open-sourced Pi Dashboard - a Raspberry Pi system monitor with Docker management! 🚀
🔗 https://github.com/yourusername/pi-dashboard
#RaspberryPi #Python #OpenSource"
```

## 📚 Additional Resources

### GitHub Documentation
- [GitHub Docs](https://docs.github.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Pages](https://pages.github.com/)

### Python Packaging
- [PyPI](https://pypi.org/)
- [Setuptools](https://setuptools.pypa.io/)
- [Twine](https://twine.readthedocs.io/)

## 🎉 You're Done!

Your Pi Dashboard repository is now set up on GitHub with:
- ✅ All source code
- ✅ CI/CD pipelines
- ✅ Security scanning
- ✅ Issue templates
- ✅ Branch protection
- ✅ Comprehensive documentation

Happy coding! 🎉
