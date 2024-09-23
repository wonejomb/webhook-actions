const { getInput, setFailed } = require("@actions/core");
const { context, getOctokit } = require("@actions/github");
const axios = require("axios");

class Status {
    static Started = new Status({ color: 0x6aab11, friendlyName: 'Started' });
    static Success = new Status({ color: 0x11ab2a, friendlyName: 'Successful' });
    static Failed = new Status({ color: 0x82041d, friendlyName: 'Failed' });
    static Cancelled = new Status({ color: 0xeeb10e, friendlyName: 'Cancelled' });
    static Timedout = new Status({ color: 0x7290c1, friendlyName: 'Timed-Out' });

    constructor({ color, friendlyName }) {
        this.color = color;
        this.friendlyName = friendlyName;
    }
}

async function run() {
    try {
        const octo = getOctokit(getInput("github_token"));

        const lastCommit = await octo.rest.repos.getCommit({
            ...context.repo,
            ref: context.sha
        });

        const status = getByStatus(getInput("status"));

        const fields = [
            { name: 'Build Branch', value: context.payload.ref?.replace("refs/heads/", ""), inline: true },
            { name: 'Commit Sender', value: lastCommit.data.author?.name || 'Unknown Author', inline: true },
            { name: `Repo URL`, value: `[${context.repo.repo}](https://github.com/${context.repo.owner}/${context.repo.repo})`, inline: true }
        
        ];

        const embed = {
            title: `Build ${status.friendlyName}`,
            description: `\`\`\`${lastCommit.data.commit.message}\`\`\``,
            color: status.color,
            url: lastCommit.data.html_url,
            timestamp: new Date().toISOString(),
            fields: fields,
            author: {
                name: lastCommit.data.author?.name || 'Unknown Author',
                url: lastCommit.data.author?.html_url || "https://avatars.githubusercontent.com/u/9919?s=200&v=4",
                icon_url: lastCommit.data.author?.avatar_url || "https://avatars.githubusercontent.com/u/9919?s=200&v=4"
            }
        };

        const json = {
            username: getInput("webhook_name") || "GitHub Actions",
            avatar_url: getInput("webhook_avatar") || "https://avatars.githubusercontent.com/in/15368?v=4",
            embeds: [embed]
        };

        console.log(`Post Body: ${JSON.stringify(json)}`);

        const response = await axios.post(getInput("webhook_url"), json, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        console.log(`Webhook response: ${response.status} - ${JSON.stringify(response.data)}`);
    } catch (error) {
        console.error(`Failed to send webhook: ${error.message}`);
        console.error(`Error details: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
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

run();