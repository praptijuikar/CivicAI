const fs = require('fs');

const path = './src/components/AuthorityDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStatusLogic = `      const matchesStatus =
        selectedStatus === "ALL" || issue.status === selectedStatus;`;

const newStatusLogic = `      let matchesStatus = false;
      switch (selectedStatus) {
        case "ALL":
          matchesStatus = true;
          break;
        case "new":
          matchesStatus = issue.status === "submitted";
          break;
        case "needs-ai-review":
          matchesStatus = issue.aiAnalysis?.verificationStatus === "needs_review";
          break;
        case "verified":
          matchesStatus = issue.status === "verified";
          break;
        case "assigned":
          matchesStatus = issue.status === "assigned";
          break;
        case "in-progress":
          matchesStatus = issue.status === "in_progress";
          break;
        case "overdue":
          matchesStatus = (issue.status === "in_progress" || issue.status === "assigned") && 
                          !!issue.deadlineAt && 
                          new Date(issue.deadlineAt) < new Date();
          break;
        case "escalated":
          matchesStatus = (issue as any).escalationId != null || (issue as any).escalated === true;
          break;
        case "resolved":
          matchesStatus = issue.status === "resolved";
          break;
      }`;

const targetSelectOptions = `              <option value="ALL">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="in-progress">{t('In Progress')}</option>
              <option value="resolved">{t('Resolved')}</option>`;

const newSelectOptions = `              <option value="ALL">All Statuses</option>
              <option value="new">New (Submitted)</option>
              <option value="needs-ai-review">Needs AI Review</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">{t('In Progress')}</option>
              <option value="overdue">Overdue</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">{t('Resolved')}</option>`;

content = content.replace(targetStatusLogic, newStatusLogic);
content = content.replace(targetSelectOptions, newSelectOptions);

fs.writeFileSync(path, content, 'utf8');
console.log('Update complete.');
