const { getInput, setFailed } = require("@actions/core");
const { context, getOctokit } = require("@actions/github");
const axios = require("axios");
const Status = require("./Status");

module.exports = async function run () {
    try {
        const octo = getOctokit(getInput("github_token"));
        const lastCommit = await octo.rest.repos.getCommit({ ...context.repo, ref: context.sha });

        const fields = [];
        fields.push({ name: 'Build Branch', value: context.payload.ref?.toString().replace("refs/heads/", ""), inline: true});

        const status = getByStatus(lastCommit.status);
        
        const embed = {
            title: `Build ${status.friendlyName} | [${context.repo.repo}](https://github.com/${context.repo.owner}/${context.repo.repo})`,
            description: `\`\`\`${lastCommit.data.commit.message}\`\`\``,
            color: status.color,
            fields: fields,
            author: {
                name: lastCommit.data.author.name,
                url: `https://github.com/${lastCommit.data.author.name}`,
                icon_url: lastCommit.data.author.avatar_url
            },
            timestamp: new Date().toISOString ()
        };
        
        const json = {
            username: getInput("webhook_name"),
            avatar_url: getInput("webhook_avatar"),
            embeds: [embed]
        };

        console.log(`Post Body: ${JSON.stringify(json)}`);

        const respose = await axios.post(getInput("webhook_url"), json, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log(`Webhook respose: ${respose.status} - ${JSON.stringify(response.data)}`);
    } catch ( error ) {
        console.error(`Failed to send webhook: ${error}`);
        console.error(`Error details: ${error.respose ? JSON.stringify(error.response.data) : error.message}`);
        setFailed(error.message);
    }
}

function getByStatus(status) {
    switch (status.toLowerCase()) {
        case 'started':
        case 'pending':
            return Status.Started;
        case 'success':
            return Status.Success;
        case 'failure':
            return Status.Failed;
        case 'cancelled':
        case 'canceled':
            return Status.Cancelled;
        case 'timedout':
        case 'timeout':
            return Status.Timedout;
        default:
            return Status.Started;
    }
}