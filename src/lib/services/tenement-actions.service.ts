'use client';

export interface TenementAction {
  id: string;
  type: 'bookmark' | 'map' | 'download' | 'share' | 'alert' | 'note';
  tenementId: string;
  tenementNumber: string;
  jurisdiction: string;
  data?: any;
  createdAt: Date;
}

export interface BookmarkData {
  notes?: string;
  tags?: string[];
  folder?: string;
}

export interface AlertData {
  type: 'expiry' | 'status_change' | 'holder_change' | 'area_change';
  enabled: boolean;
  notificationMethod: 'email' | 'browser' | 'both';
}

export interface ShareData {
  type: 'link' | 'report' | 'email';
  recipients?: string[];
  message?: string;
  includeDetails: boolean;
}

class TenementActionsService {
  private readonly STORAGE_KEY = 'mining-hub-tenement-actions';
  private actions: TenementAction[] = [];

  constructor() {
    this.loadActions();
  }

  // Load actions from localStorage
  private loadActions(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.actions = JSON.parse(stored).map((action: any) => ({
            ...action,
            createdAt: new Date(action.createdAt)
          }));
        }
      } catch (error) {
        console.error('Failed to load tenement actions:', error);
        this.actions = [];
      }
    }
  }

  // Save actions to localStorage
  private saveActions(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.actions));
      } catch (error) {
        console.error('Failed to save tenement actions:', error);
      }
    }
  }

  // Bookmark Management
  async bookmarkTenement(
    tenementId: string, 
    tenementNumber: string, 
    jurisdiction: string, 
    data: BookmarkData = {}
  ): Promise<boolean> {
    try {
      // Remove existing bookmark if it exists
      this.actions = this.actions.filter(
        action => !(action.type === 'bookmark' && action.tenementId === tenementId)
      );

      // Add new bookmark
      const bookmark: TenementAction = {
        id: `bookmark-${tenementId}-${Date.now()}`,
        type: 'bookmark',
        tenementId,
        tenementNumber,
        jurisdiction,
        data,
        createdAt: new Date()
      };

      this.actions.push(bookmark);
      this.saveActions();
      return true;
    } catch (error) {
      console.error('Failed to bookmark tenement:', error);
      return false;
    }
  }

  async removeBookmark(tenementId: string): Promise<boolean> {
    try {
      const initialLength = this.actions.length;
      this.actions = this.actions.filter(
        action => !(action.type === 'bookmark' && action.tenementId === tenementId)
      );
      
      if (this.actions.length < initialLength) {
        this.saveActions();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      return false;
    }
  }

  isBookmarked(tenementId: string): boolean {
    return this.actions.some(
      action => action.type === 'bookmark' && action.tenementId === tenementId
    );
  }

  getBookmarks(): TenementAction[] {
    return this.actions.filter(action => action.type === 'bookmark');
  }

  // Export/Download functionality
  async downloadTenementData(
    tenementId: string, 
    tenementNumber: string, 
    jurisdiction: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<boolean> {
    try {
      // Fetch tenement data
      const response = await fetch(`http://localhost:4000/api/tenements/${tenementId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tenement data');
      }

      const tenementData = await response.json();

      // Log the download action
      const downloadAction: TenementAction = {
        id: `download-${tenementId}-${Date.now()}`,
        type: 'download',
        tenementId,
        tenementNumber,
        jurisdiction,
        data: { format, downloadedAt: new Date() },
        createdAt: new Date()
      };

      this.actions.push(downloadAction);
      this.saveActions();

      // Create and trigger download
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          content = this.convertToCSV(tenementData);
          filename = `tenement-${tenementNumber}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          // For now, we'll use JSON format for PDF (would need PDF library for real PDF)
          content = JSON.stringify(tenementData, null, 2);
          filename = `tenement-${tenementNumber}.json`;
          mimeType = 'application/json';
          break;
        default:
          content = JSON.stringify(tenementData, null, 2);
          filename = `tenement-${tenementNumber}.json`;
          mimeType = 'application/json';
      }

      // Create download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Failed to download tenement data:', error);
      return false;
    }
  }

  // Share functionality
  async shareTenement(
    tenementId: string,
    tenementNumber: string,
    jurisdiction: string,
    shareData: ShareData
  ): Promise<boolean> {
    try {
      const shareAction: TenementAction = {
        id: `share-${tenementId}-${Date.now()}`,
        type: 'share',
        tenementId,
        tenementNumber,
        jurisdiction,
        data: shareData,
        createdAt: new Date()
      };

      this.actions.push(shareAction);
      this.saveActions();

      // Generate share content
      const tenementUrl = `${window.location.origin}/tenements/details/${tenementId}`;
      
      switch (shareData.type) {
        case 'link':
          // Copy link to clipboard
          await navigator.clipboard.writeText(tenementUrl);
          return true;
          
        case 'email':
          // Open email client
          const subject = `Mining Tenement: ${tenementNumber} (${jurisdiction})`;
          const body = `Check out this mining tenement:\n\n${tenementUrl}\n\n${shareData.message || ''}`;
          const mailtoUrl = `mailto:${shareData.recipients?.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          window.open(mailtoUrl);
          return true;
          
        case 'report':
          // Generate and download a report
          return this.downloadTenementData(tenementId, tenementNumber, jurisdiction, 'json');
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to share tenement:', error);
      return false;
    }
  }

  // Map view functionality
  async viewOnMap(
    tenementId: string,
    tenementNumber: string,
    jurisdiction: string
  ): Promise<boolean> {
    try {
      const mapAction: TenementAction = {
        id: `map-${tenementId}-${Date.now()}`,
        type: 'map',
        tenementId,
        tenementNumber,
        jurisdiction,
        data: { viewedAt: new Date() },
        createdAt: new Date()
      };

      this.actions.push(mapAction);
      this.saveActions();

      // For now, we'll just log the action
      // In the future, this would open a map component or navigate to a map page
      console.log(`Opening map view for tenement ${tenementNumber} in ${jurisdiction}`);
      
      // TODO: Implement actual map integration
      // This could open a modal with a map, or navigate to a dedicated map page
      
      return true;
    } catch (error) {
      console.error('Failed to open map view:', error);
      return false;
    }
  }

  // Utility functions
  private convertToCSV(data: any): string {
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(value => 
      typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    ).join(',');
    return `${headers}\n${values}`;
  }

  // Get action history
  getActionHistory(tenementId?: string): TenementAction[] {
    if (tenementId) {
      return this.actions.filter(action => action.tenementId === tenementId);
    }
    return [...this.actions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Clear all actions (for testing/reset)
  clearAllActions(): void {
    this.actions = [];
    this.saveActions();
  }
}

// Export singleton instance
export const tenementActionsService = new TenementActionsService();
