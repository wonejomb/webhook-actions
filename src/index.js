const { getInput, setFailed } = require("@actions/core");
const { context, getOctokit } = require("@actions/github");
const axios = require("axios");

class Status {
    static Started = new Status({ color: 0x6aab11, friendlyName: 'Started' });
    static Success = new Status({ color: 0x11ab2a, friendlyName: 'Successful' });
    static Failed = new Status({ color: 0x82041d, friendlyName: 'Failed' });
    static Cancelled = new Status({ color: 0xeeb10e, friendlyName: 'Cancelled' });
    static Timedout = new Status({ color: 0x7290c1, friendlyName: 'Timed-Out' });

    constructor ({ color, friendlyName }) {
        this.color = color;
        this.friendlyName = friendlyName;
    }
}

const StartedStatus = Status.Success;
const SuccessStatus = Status.Success;
const FailedStatus = Status.Success;
const CancelledStatus = Status.Success;
const TimestoutStatus = Status.Success;

module.exports = async function run () {
    try {
        const octo = getOctokit(process.env.GITHUB_TOKEN);
        const lastCommit = await octo.rest.repos.getCommit({ ...context.repo, ref: context.sha });

        const fields = [];
        fields.push({ name: 'Build Branch', value: context.payload.ref?.toString().replace("refs/heads/", ""), inline: true});
        fields.push({ name: `Commit Sender`, value: lastCommit.data.author.name, inline:  true });

        const status = getByStatus(lastCommit.status);
        
        const embed = {
            title: `Build ${status.friendlyName} | [${context.repo.repo}](https://github.com/${context.repo.owner}/${context.repo.repo})`,
            type: 'rich',
            description: `\`\`\`${lastCommit.data.commit.message}\`\`\``,
            color: status.color,
            url: lastCommit.data.url,
            timestamp: new Date().toISOString (),
            fields: fields,
            author: {
                name: `${lastCommit.data.author.name}`,
                url: `${lastCommit.data.author.url}`,
                icon_url: `${lastCommit.data.author.avatar_url}`
            }
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
            return StartedStatus;
        case 'success':
            return SuccessStatus;
        case 'failure':
            return FailedStatus;
        case 'cancelled':
        case 'canceled':
            return CancelledStatus;
        case 'timedout':
        case 'timeout':
            return TimestoutStatus;
        default:
            return StartedStatus;
    }
}