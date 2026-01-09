/**
 * Enhanced Tenement Data Storage Service
 * Stores comprehensive tenement, project, and site data in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { EnhancedMinedxTenement, MinedxProject, MinedxSite } from './minedx-enhanced-scraper';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class EnhancedTenementStorage {
  
  /**
   * Store comprehensive tenement data including all related entities
   */
  async storeTenementData(tenementData: EnhancedMinedxTenement): Promise<boolean> {
    try {
      console.log(`Storing enhanced data for tenement: ${tenementData.tenementNumber}`);

      // Start a transaction-like operation
      const { data: tenement, error: tenementError } = await this.upsertTenement(tenementData);
      if (tenementError || !tenement) {
        console.error('Failed to upsert tenement:', tenementError);
        return false;
      }

      const tenementId = tenement.id;

      // Store projects and get their IDs
      const projectIds = await this.storeProjects(tenementData.projects, tenementId);

      // Store sites
      await this.storeSites(tenementData.sites, tenementId, projectIds);

      // Store environmental registrations
      await this.storeEnvironmentalRegistrations(tenementData.environmentalRegistrations, tenementId, projectIds);

      // Store production records
      await this.storeProductionRecords(tenementData.production, tenementId);

      // Store information sources
      await this.storeInformationSources(tenementData.informationSources, tenementId, projectIds);

      // Update tenement with enhanced data flag and counts
      await this.updateTenementEnhancedStatus(tenementId, {
        sites_count: tenementData.sites.length,
        projects_count: tenementData.projects.length,
        environmental_registrations_count: tenementData.environmentalRegistrations.length,
        production_records_count: tenementData.production.length
      });

      console.log(`Successfully stored enhanced data for tenement: ${tenementData.tenementNumber}`);
      return true;

    } catch (error) {
      console.error(`Error storing tenement data for ${tenementData.tenementNumber}:`, error);
      return false;
    }
  }

  private async upsertTenement(tenementData: EnhancedMinedxTenement) {
    // First, try to find existing tenement
    const { data: existing } = await supabase
      .from('tenements')
      .select('id')
      .eq('number', tenementData.tenementNumber)
      .single();

    const tenementRecord = {
      number: tenementData.tenementNumber,
      type: tenementData.tenementType,
      status: tenementData.status,
      applied_date: tenementData.appliedDate ? new Date(tenementData.appliedDate) : null,
      granted_date: tenementData.grantedDate ? new Date(tenementData.grantedDate) : null,
      expiry_date: tenementData.expiryDate ? new Date(tenementData.expiryDate) : null,
      death_date: tenementData.deathDate ? new Date(tenementData.deathDate) : null,
      area_ha: tenementData.area,
      holder_name: tenementData.holders?.map(h => h.holderName).join(', ') || '',
      jurisdiction: 'WA', // Assuming WA since it's from MINEDX
      minedx_url: tenementData.minedxUrl,
      last_sync_at: new Date(tenementData.lastScraped),
      enhanced_data_scraped: true,
      enhanced_data_scraped_at: new Date()
    };

    if (existing) {
      // Update existing tenement
      const { data, error } = await supabase
        .from('tenements')
        .update(tenementRecord)
        .eq('id', existing.id)
        .select()
        .single();
      
      return { data, error };
    } else {
      // Insert new tenement
      const { data, error } = await supabase
        .from('tenements')
        .insert(tenementRecord)
        .select()
        .single();
      
      return { data, error };
    }
  }

  private async storeProjects(projects: MinedxProject[], tenementId: string): Promise<Map<string, string>> {
    const projectIds = new Map<string, string>();

    for (const project of projects) {
      try {
        // Check if project already exists
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('project_code', project.projectCode)
          .single();

        const projectRecord = {
          project_name: project.projectName,
          project_code: project.projectCode,
          short_name: project.shortName,
          commodity: project.commodity,
          project_status: project.projectStatus,
          project_stage: project.projectStage,
          mine_stage: project.mineStage,
          small_mining_operation: project.smallMiningOperation,
          total_current_sites: project.totalCurrentSites,
          start_date: project.startDate ? new Date(project.startDate) : null,
          end_date: project.endDate ? new Date(project.endDate) : null,
          commodities_and_groups: project.commoditiesAndGroups || [],
          alternative_names: project.alternativeNames || [],
          notes: project.notes || []
        };

        let projectId: string;

        if (existing) {
          // Update existing project
          const { data, error } = await supabase
            .from('projects')
            .update(projectRecord)
            .eq('id', existing.id)
            .select('id')
            .single();

          if (error) throw error;
          projectId = data.id;
        } else {
          // Insert new project
          const { data, error } = await supabase
            .from('projects')
            .insert(projectRecord)
            .select('id')
            .single();

          if (error) throw error;
          projectId = data.id;
        }

        projectIds.set(project.projectCode, projectId);

        // Create tenement-project relationship
        await supabase
          .from('tenement_projects')
          .upsert({
            tenement_id: tenementId,
            project_id: projectId
          }, {
            onConflict: 'tenement_id,project_id'
          });

        // Store project owners
        if (project.owners && project.owners.length > 0) {
          await this.storeProjectOwners(project.owners, projectId);
        }

        // Store project attachments
        if (project.attachments && project.attachments.length > 0) {
          await this.storeProjectAttachments(project.attachments, projectId);
        }

        // Store project events
        if (project.events && project.events.length > 0) {
          await this.storeProjectEvents(project.events, projectId);
        }

      } catch (error) {
        console.error(`Error storing project ${project.projectCode}:`, error);
      }
    }

    return projectIds;
  }

  private async storeSites(sites: MinedxSite[], tenementId: string, projectIds: Map<string, string>) {
    for (const site of sites) {
      try {
        const projectId = site.projectCode ? projectIds.get(site.projectCode) : null;

        const siteRecord = {
          tenement_id: tenementId,
          project_id: projectId,
          site_name: site.siteName,
          site_code: site.siteCode,
          site_type: site.siteType,
          site_subtype: site.siteSubtype,
          site_stage: site.siteStage,
          primary_classification: site.primary,
          coordinates: site.coordinates ? JSON.stringify(site.coordinates) : null,
          start_date: site.startDate ? new Date(site.startDate) : null,
          end_date: site.endDate ? new Date(site.endDate) : null
        };

        // Check if site already exists
        const { data: existing } = await supabase
          .from('sites')
          .select('id')
          .eq('site_code', site.siteCode)
          .eq('tenement_id', tenementId)
          .single();

        if (existing) {
          await supabase
            .from('sites')
            .update(siteRecord)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('sites')
            .insert(siteRecord);
        }

      } catch (error) {
        console.error(`Error storing site ${site.siteName}:`, error);
      }
    }
  }

  private async storeEnvironmentalRegistrations(registrations: any[], tenementId: string, projectIds: Map<string, string>) {
    for (const reg of registrations) {
      try {
        const regRecord = {
          tenement_id: tenementId,
          project_id: null, // Could be linked to project if we have that info
          registration_id: reg.registrationId,
          registration_name: reg.registrationName,
          registration_category: reg.registrationCategory,
          registration_status: reg.registrationStatus,
          date_decided: reg.dateDecided ? new Date(reg.dateDecided) : null,
          environmental_operator: reg.environmentalOperator
        };

        await supabase
          .from('environmental_registrations')
          .upsert(regRecord, {
            onConflict: 'tenement_id,registration_id'
          });

      } catch (error) {
        console.error(`Error storing environmental registration:`, error);
      }
    }
  }

  private async storeProductionRecords(production: any[], tenementId: string) {
    for (const prod of production) {
      try {
        const prodRecord = {
          tenement_id: tenementId,
          start_date: prod.startDate ? new Date(prod.startDate) : null,
          end_date: prod.endDate ? new Date(prod.endDate) : null,
          production_period: prod.productionPeriod,
          product: prod.product,
          quantity: prod.quantity,
          unit: prod.unit,
          grade: prod.grade,
          commodity: prod.commodity,
          calculated_commodity: prod.calculatedCommodity
        };

        await supabase
          .from('production_records')
          .insert(prodRecord);

      } catch (error) {
        console.error(`Error storing production record:`, error);
      }
    }
  }

  private async storeInformationSources(sources: any[], tenementId: string, projectIds: Map<string, string>) {
    for (const source of sources) {
      try {
        const sourceRecord = {
          tenement_id: tenementId,
          project_id: null, // Could be linked to project if needed
          source_type: source.type,
          title: source.title,
          identifier: source.identifier
        };

        await supabase
          .from('information_sources')
          .insert(sourceRecord);

      } catch (error) {
        console.error(`Error storing information source:`, error);
      }
    }
  }

  private async storeProjectOwners(owners: any[], projectId: string) {
    // Delete existing owners for this project
    await supabase
      .from('project_owners')
      .delete()
      .eq('project_id', projectId);

    // Insert new owners
    for (const owner of owners) {
      try {
        const ownerRecord = {
          project_id: projectId,
          owner_name: owner.ownerName,
          owner_type: owner.ownerType,
          percentage: owner.percentage,
          start_date: owner.startDate ? new Date(owner.startDate) : null,
          end_date: owner.endDate ? new Date(owner.endDate) : null
        };

        await supabase
          .from('project_owners')
          .insert(ownerRecord);

      } catch (error) {
        console.error(`Error storing project owner:`, error);
      }
    }
  }

  private async storeProjectAttachments(attachments: any[], projectId: string) {
    for (const attachment of attachments) {
      try {
        const attachmentRecord = {
          project_id: projectId,
          file_name: attachment.fileName,
          file_type: attachment.fileType,
          file_size: attachment.fileSize,
          upload_date: attachment.uploadDate ? new Date(attachment.uploadDate) : null,
          description: attachment.description
        };

        await supabase
          .from('project_attachments')
          .upsert(attachmentRecord, {
            onConflict: 'project_id,file_name'
          });

      } catch (error) {
        console.error(`Error storing project attachment:`, error);
      }
    }
  }

  private async storeProjectEvents(events: any[], projectId: string) {
    for (const event of events) {
      try {
        const eventRecord = {
          project_id: projectId,
          event_date: new Date(event.eventDate),
          event_type: event.eventType,
          description: event.description,
          source: event.source
        };

        await supabase
          .from('project_events')
          .insert(eventRecord);

      } catch (error) {
        console.error(`Error storing project event:`, error);
      }
    }
  }

  private async updateTenementEnhancedStatus(tenementId: string, counts: any) {
    await supabase
      .from('tenements')
      .update({
        enhanced_data_scraped: true,
        enhanced_data_scraped_at: new Date(),
        ...counts
      })
      .eq('id', tenementId);
  }

  /**
   * Get enhanced tenement data from database
   */
  async getEnhancedTenementData(tenementNumber: string) {
    const { data: tenement, error } = await supabase
      .from('tenements_with_enhanced_data')
      .select('*')
      .eq('number', tenementNumber)
      .single();

    if (error || !tenement) {
      return null;
    }

    // Get related data
    const [sites, projects, environmentalRegs, production, infoSources] = await Promise.all([
      this.getTenementSites(tenement.id),
      this.getTenementProjects(tenement.id),
      this.getTenementEnvironmentalRegistrations(tenement.id),
      this.getTenementProduction(tenement.id),
      this.getTenementInformationSources(tenement.id)
    ]);

    return {
      ...tenement,
      sites,
      projects,
      environmentalRegistrations: environmentalRegs,
      production,
      informationSources: infoSources
    };
  }

  private async getTenementSites(tenementId: string) {
    const { data } = await supabase
      .from('sites')
      .select('*')
      .eq('tenement_id', tenementId);
    
    return data || [];
  }

  private async getTenementProjects(tenementId: string) {
    // First get project IDs for this tenement
    const { data: projectLinks } = await supabase
      .from('tenement_projects')
      .select('project_id')
      .eq('tenement_id', tenementId);

    if (!projectLinks || projectLinks.length === 0) {
      return [];
    }

    const projectIds = projectLinks.map(link => link.project_id);

    // Then get project details
    const { data } = await supabase
      .from('projects_with_details')
      .select(`
        *,
        project_owners(*),
        project_attachments(*),
        project_events(*)
      `)
      .in('id', projectIds);
    
    return data || [];
  }

  private async getTenementEnvironmentalRegistrations(tenementId: string) {
    const { data } = await supabase
      .from('environmental_registrations')
      .select('*')
      .eq('tenement_id', tenementId);
    
    return data || [];
  }

  private async getTenementProduction(tenementId: string) {
    const { data } = await supabase
      .from('production_records')
      .select('*')
      .eq('tenement_id', tenementId);
    
    return data || [];
  }

  private async getTenementInformationSources(tenementId: string) {
    const { data } = await supabase
      .from('information_sources')
      .select('*')
      .eq('tenement_id', tenementId);
    
    return data || [];
  }
}

export const enhancedTenementStorage = new EnhancedTenementStorage();
