<!-- Text extracted from docs/FRD.pdf (authoritative source). Tables may be imperfectly formatted; refer to the PDF where unclear. -->

FUNCTIONAL REQUIREMENTS DOCUMENT (FRD)
Kogi State Rural Electrification Needs Assessment and Planning Platform
Project Name: Kogi State Rural Electrification Decision-Support Platform​
Initial Implementation: Three selected LGAs in Kogi State​
Document Version: 1.0 – Draft




1. PROJECT OVERVIEW
1.1 Background
There are communities across Kogi State experiencing little or no reliable electricity. However,
identifying these communities is not enough. Government agencies need to understand the number
of affected households, schools, hospitals and businesses, their actual electricity requirements, the
most suitable renewable energy solutions and the estimated cost of providing electricity.
The proposed platform will provide a digital system for identifying underserved communities,
collecting electricity-access information, assessing energy requirements, recommending possible
renewable energy interventions and supporting investment decisions.
1.2 Project Objectives
The platform is expected to:
   1.​ Identify communities with no or unreliable electricity.
   2.​ Allow residents to report electricity challenges in their communities.
   3.​ Collect and verify information about affected households and facilities.
   4.​ Determine the estimated electricity demand of each community.
   5.​ Recommend appropriate renewable energy solutions.
   6.​ Estimate the cost of proposed interventions.
   7.​ Rank communities according to their level of need and urgency.
   8.​ Provide government and relevant agencies with information for rural electrification
       planning.


2. PLATFORM STRUCTURE
The project will be developed as one integrated web-based platform, divided into seven
functional categories.
No. Functional Category                          Main Purpose

                                                 Provides a summary of electricity-access challenges
1    Dashboard and Overview
                                                 and assessment results.

     Geographic and Community                    Manages the three selected LGAs, wards and
2
     Management                                  communities.

                                                 Allows residents to report communities experiencing
3    Public Electricity Reporting
                                                 electricity challenges.

                                                 Enables assigned officers to verify reports and
4    Field Data Collection and Verification
                                                 conduct detailed assessments.

                                                 Calculates the electricity requirements of
5    Energy Needs Assessment
                                                 households and facilities.

     Renewable Energy Recommendation and Suggests possible solutions and estimates
6
     Cost Estimation                     intervention costs.

                                                 Identifies priority communities and provides reports
7    Planning, Prioritisation and Reporting
                                                 for investment decisions.


3. FUNCTIONAL REQUIREMENTS BY CATEGORY
CATEGORY 1: DASHBOARD AND OVERVIEW
Purpose: To provide an overview of electricity-access challenges across the three selected LGAs.
What this category should do
The dashboard should display important information collected and processed by the platform.
Functional Requirements
    ●​   Display the three selected LGAs in Kogi State.
    ●​   Display the total number of registered communities.
    ●​   Show the number of communities reported to have electricity challenges.
    ●​   Show the number of verified and assessed communities.
    ●​   Display the number of affected households.
    ●​   Display the number of schools, hospitals, businesses and public facilities assessed.
    ●​   Show communities with no electricity, unreliable electricity or inadequate supply.
    ●​   Display estimated electricity demand across assessed communities.
   ●​   Show proposed renewable energy interventions.
   ●​   Display estimated intervention costs.
   ●​   Show high-, medium- and low-priority communities.
   ●​   Allow filtering by LGA, ward and community.
Expected Output
A dashboard that provides a quick understanding of the electricity situation and assessment
progress across the three LGAs.


CATEGORY 2: GEOGRAPHIC AND COMMUNITY MANAGEMENT
Purpose: To organise and manage the geographical information of the communities being
assessed.
What this category should do
It should provide the geographical structure of the project and enable users to identify
communities on an interactive map.
Functional Requirements
   ●​   Configure the three selected LGAs.
   ●​   Register wards under each LGA.
   ●​   Register communities under their respective wards and LGAs.
   ●​   Capture community names and descriptions.
   ●​   Capture GPS coordinates of communities.
   ●​   Record estimated population and number of households, where available.
   ●​   Display communities on an interactive map.
   ●​   Use different map markers to identify communities based on electricity-access status.
   ●​   Allow users to select a community on the map and view its information.
   ●​   Allow users to filter communities by LGA and electricity status.
   ●​   Allow authorised users to update community information.
Suggested Map Indicators
   ●​   Red: No electricity access.
   ●​   Orange: Unreliable or inadequate electricity.
   ●​   Green: Relatively reliable electricity.
   ●​   Blue: Proposed intervention or project location.
The map should distinguish reported locations from verified and assessed locations.
Expected Output
An interactive map showing the selected LGAs, their communities and the electricity-access
situation of each community.


CATEGORY 3: PUBLIC ELECTRICITY REPORTING PORTAL
Purpose: To allow residents and other members of the public to report communities experiencing
electricity challenges directly through the platform.
This category will make the platform participatory rather than depending entirely on government
officials or field officers to identify underserved communities.
What this category should do
Residents should be able to access a public section of the platform and submit information about
electricity challenges in their communities without needing an administrative account.
Functional Requirements
   ●​   Provide a publicly accessible electricity reporting form.
   ●​   Allow users to select their LGA.
   ●​   Allow users to select or enter their ward and community.
   ●​   Allow users to indicate the electricity situation in their community.
   ●​   Provide the following reporting options:
            o​   No electricity.
            o​   Irregular electricity supply.
            o​   Inadequate electricity supply.
            o​   Electricity available only in certain parts of the community.
   ●​   Allow users to indicate how long the problem has existed.
   ●​   Allow users to estimate the number of affected households, where known.
   ●​   Allow users to identify affected facilities such as schools, hospitals and businesses.
   ●​   Provide a description field for additional information.
   ●​   Allow users to submit GPS coordinates or select a location on the map.
   ●​   Allow users to upload photographs as supporting evidence.
   ●​   Allow optional contact details for follow-up.
   ●​   Generate a unique reference number after successful submission.
   ●​   Allow residents to check the status of their submissions using the reference number.
   ●​   Prevent or flag duplicate submissions where possible.
Report Status
Every public submission should have a status:
   1.​ Submitted.
   2.​ Under Review.
   3.​ Verified.
   4.​ Rejected.
   5.​ Assessed.
Only verified information should be treated as confirmed community assessment data.
Expected Output
A growing database of electricity challenges reported directly by residents across the three
selected LGAs.


CATEGORY 4: FIELD DATA COLLECTION AND VERIFICATION
Purpose: To enable assigned field officers to verify public reports and collect detailed
information about electricity needs in identified communities.
Public reporting will identify possible problem areas, while field assessments will establish more
reliable information for planning.
What this category should do
It should provide digital assessment forms that field officers can use when visiting communities.
Functional Requirements
A. Community Assessment
   ●​   Record the community's electricity-access situation.
   ●​   Confirm whether the community is connected to the national grid.
   ●​   Record average electricity supply hours.
   ●​   Record the frequency of power interruptions, where known.
   ●​   Identify existing alternative energy sources.
   ●​   Record the number of households with and without electricity.
   ●​   Capture GPS coordinates and supporting photographs.
B. Household Assessment
   ●​   Record the number of households assessed.
   ●​   Estimate households without electricity.
   ●​   Record existing electricity sources.
   ●​   Identify common electrical appliances.
   ●​   Capture estimated daily usage.
C. School Assessment
   ●​   Record school name and location.
   ●​   Identify the school type.
   ●​   Record the number of classrooms and offices.
   ●​   Capture electrical equipment and appliances.
   ●​   Record existing electricity sources and operating hours.
D. Hospital and Health Facility Assessment
   ●​   Record facility name and location.
   ●​   Identify facility type.
   ●​   Record medical equipment and electrical appliances.
   ●​   Capture refrigeration and vaccine-storage requirements.
   ●​   Record lighting and other critical electricity needs.
   ●​   Record existing electricity sources.
E. Business Assessment
   ●​   Record business name or category.
   ●​   Identify business type.
   ●​   Capture equipment and appliances used.
   ●​   Record operating hours.
   ●​   Estimate electricity requirements.
   ●​   Record existing energy sources.
Examples include grain mills, agricultural processing businesses, shops, welding businesses,
cold-storage facilities and other SMEs.
F. Verification
   ●​   Allow field officers to review public submissions.
   ●​   Allow officers to confirm or reject submitted reports.
   ●​   Record verification comments and evidence.
   ●​   Update the report status.
   ●​   Assign communities for detailed assessment.
   ●​   Record the officer responsible and assessment date.
G. Offline Data Collection
Where internet connectivity is unavailable, the system should support saving field assessment
forms offline and synchronising them when connectivity is restored, subject to implementation
feasibility.
Expected Output
Verified community records containing household, school, health facility and business information
for energy-demand analysis.


CATEGORY 5: ENERGY NEEDS ASSESSMENT
Purpose: To determine how much electricity each community and its facilities require.
What this category should do
The system should analyse the equipment, appliances, quantities and operating hours captured
during field assessments to estimate daily electricity demand.
Functional Requirements
   ●​   Provide a list of common electrical appliances and equipment.
   ●​   Allow users to add equipment not already in the system.
   ●​   Capture the rated power of each appliance in watts.
   ●​   Capture the quantity of each appliance.
   ●​   Capture estimated operating hours per day.
   ●​   Calculate estimated daily electricity consumption.
   ●​   Calculate electricity demand for individual facilities.
   ●​   Aggregate electricity demand at community level.
   ●​   Estimate peak electricity load using documented assumptions.
   ●​   Display results in kWh/day and kW.
   ●​   Allow authorised analysts to review and adjust calculation assumptions.
   ●​   Retain the calculation assumptions used for each assessment.
Basic Calculation
Daily Energy Consumption:
Energy (Wh/day) = Power (W) × Quantity × Operating Hours
Total Community Energy Demand:
Total kWh/day = Sum of all equipment energy consumption ÷ 1,000
The system should also account for operating patterns and simultaneous usage when estimating
peak load.
Expected Output
A report showing how much electricity each community, household group, school, hospital and
business is estimated to require.


CATEGORY 6: RENEWABLE ENERGY RECOMMENDATION AND COST ESTIMATION
Purpose: To recommend possible renewable energy solutions based on the electricity
requirements of each community and estimate the cost of implementing them.
What this category should do
The system should analyse the energy assessment results and suggest appropriate interventions.
Functional Requirements
   ●​   Analyse total electricity demand.
   ●​   Consider the number of households and facilities.
   ●​   Consider the geographical distribution of users.
   ●​   Consider existing grid availability and reliability.
   ●​   Evaluate possible renewable energy interventions.
   ●​   Provide reasons for each recommendation.
   ●​   Estimate indicative system capacity where sufficient information exists.
   ●​   Estimate equipment requirements and costs.
   ●​   Allow an energy analyst to review or amend recommendations.
   ●​   Display the estimated cost in Nigerian Naira.
   ●​   Retain the assumptions used for each recommendation and cost estimate.
Possible Renewable Energy Recommendations
Situation                                            Possible Solution

Individual households with limited electricity needs Solar Home Systems

Clustered households and businesses                  Solar Mini-grid

Schools and healthcare facilities                    Institutional Solar Systems

Communities requiring water pumping                  Solar Water Pumping

Agricultural processing and commercial activities    Productive-Use Solar Systems
Cost Components
The cost estimation should consider:
   ●​   Solar panels.
   ●​   Batteries.
   ●​   Inverters.
   ●​   Charge controllers.
   ●​   Mounting structures.
   ●​   Distribution infrastructure.
   ●​   Protection equipment.
   ●​   Installation.
   ●​   Transportation and other applicable costs.
All cost estimates should be labelled indicative, not final supplier quotations.
Expected Output
A recommendation showing the proposed renewable energy intervention, estimated capacity,
required equipment and indicative implementation cost.


CATEGORY 7: PLANNING, PRIORITISATION AND REPORTING
Purpose: To help government agencies determine which communities should receive attention first
and support investment planning.
What this category should do
It should bring together verified community data, energy assessments, recommendations and cost
estimates to provide a clear picture of where intervention is most needed.
Functional Requirements
   ●​   Display all assessed communities and their electricity-access status.
   ●​   Rank communities according to their level of need.
   ●​   Consider the number of affected households.
   ●​   Consider the number of affected schools and healthcare facilities.
   ●​   Consider economic activities and livelihood impact.
   ●​   Consider electricity demand.
   ●​   Consider technical feasibility.
   ●​   Consider estimated intervention costs.
   ●​   Generate high-, medium- and low-priority classifications using approved criteria.
   ●​   Display the recommended intervention for each community.
   ●​   Display estimated electricity demand and indicative costs.
   ●​   Filter results by LGA and community.
   ●​   Generate community-level reports.
   ●​   Generate LGA-level reports.
   ●​   Generate priority community reports.
   ●​   Export reports in PDF and Excel formats.
Expected Output
A planning dashboard that helps decision-makers understand:
   ●​   Where electricity is most urgently needed.
   ●​   How many people and facilities are affected.
   ●​   How much electricity is required.
   ●​   What renewable energy intervention may be suitable.
   ●​   How much the proposed intervention may cost.
   ●​   Which communities should be considered for priority attention.


4. USER ROLES
The platform should support the following user categories:
User Role                            Responsibilities

Public User / Resident               Reports electricity challenges and tracks submitted reports.

System Administrator                 Manages users, LGAs, communities and platform settings.

Field Data Collector                 Conducts community and facility assessments.

LGA Officer                          Reviews public submissions and verifies community information.

Energy Analyst                       Reviews energy demand, recommendations and cost estimates.

Government / Stakeholder Viewer Views dashboards, maps, reports and priority communities.
Public users should not have access to administrative functions or the ability to edit verified
assessment records.


5. OVERALL SYSTEM WORKFLOW
The proposed workflow is:
   1.​ Community identification: Communities are registered or selected within the three LGAs.
   2.​ Public reporting: Residents report electricity challenges through the public portal.
   3.​ Verification: Assigned officers review and verify submitted reports.
   4.​ Field assessment: Officers collect detailed information about households, schools,
       hospitals and businesses.
   5.​ Energy analysis: The system calculates estimated electricity demand.
   6.​ Energy recommendation: The system suggests suitable renewable energy interventions.
   7.​ Cost estimation: Indicative costs are calculated.
    8.​ Prioritisation: Communities are ranked according to approved criteria.
    9.​ Planning and reporting: Government stakeholders review results and generate reports.


6. DATA COLLECTION APPROACH
The platform should support two complementary data collection methods.
Method 1: Public/Community-Based Reporting
Residents voluntarily submit information through the public reporting portal.
This helps identify:
    ●​   Communities experiencing electricity challenges.
    ●​   Locations that require investigation.
    ●​   Areas where households and facilities may be underserved.
    ●​   Potential communities for field assessment.
Method 2: Official Field Assessment
Assigned officers visit identified communities and collect more detailed information using digital
forms.
This helps establish:
    ●​   Actual household numbers and electricity-access conditions.
    ●​   Schools and healthcare facilities affected.
    ●​   Businesses and productive activities.
    ●​   Electrical appliances and equipment.
    ●​   Estimated energy requirements.
Important: Public reports are leads for investigation, not automatically verified data. Detailed
energy calculations and investment recommendations should use reviewed assessment information.


7. INITIAL IMPLEMENTATION SCOPE
The first implementation will focus exclusively on three selected LGAs in Kogi State.
The initial prototype should demonstrate:
    1.​ Registration of communities within the three LGAs.
    2.​ Public submission of electricity challenges.
   3.​ Review and verification of reports.
   4.​ Digital field assessment.
   5.​ Household and facility data capture.
   6.​ Energy-demand calculation.
   7.​ Renewable energy recommendation.
   8.​ Indicative cost estimation.
   9.​ Community prioritisation.
   10.​Planning dashboard and reports.
The platform should be designed to accommodate additional LGAs in future phases without
requiring a complete redesign.


8. ACCEPTANCE CRITERIA
The initial prototype will be considered functionally demonstrable when:
   ●​   The three selected LGAs are configured.
   ●​   Communities can be registered and displayed on a map.
   ●​   Residents can submit electricity reports.
   ●​   Each report receives a unique tracking reference.
   ●​   Administrators can review and verify submissions.
   ●​   Field officers can capture community and facility assessments.
   ●​   The system can estimate electricity demand.
   ●​   The system can generate renewable energy recommendations.
   ●​   Indicative intervention costs can be displayed.
   ●​   Communities can be prioritised.
   ●​   Reports can be generated for planning purposes.


9. KEY DECISIONS REQUIRED FROM THE PROJECT TEAM
Before development begins, the team should agree on:
   1.​ The three LGAs to be covered.
   2.​ The communities to be included initially.
   3.​ Whether public reporting will be open to everyone or require basic registration.
   4.​ The information required on the public reporting form.
   5.​ The field assessment questionnaire.
   6.​ Who will verify public submissions.
   7.​ The energy calculation and recommendation methodology.
   8.​ The cost data sources.
   9.​ The development technology and hosting arrangement.
   10.​Team responsibilities and delivery timeline.


10. EXPECTED PROJECT OUTCOME
The project will deliver one integrated platform that combines community participation, official
field assessment, energy-demand analysis, renewable energy recommendations, cost estimation
and investment prioritisation.
The platform should help answer five fundamental questions:
   1.​ Where is electricity most needed?
   2.​ Who is affected?
   3.​ How much electricity is required?
   4.​ What renewable energy solution is suitable?
   5.​ How much will the intervention cost?
The overall goal is to support evidence-based rural electrification planning and investment
decisions across Kogi State.
