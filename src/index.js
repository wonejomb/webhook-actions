const { getInput, setFailed } = require("@actions/core");
const { context, getOctokit } = require("@actions/github");
const axios = require("axios");

module.exports = async function run() {
    try {
        const octo = getOctokit(getInput("github_token"));
        const lastCommit = await octo.rest.repos.getCommit({
            ...context.repo,
            ref: context.sha
        });

        const fields = [];
        if (getInput("version") && getInput("version") !== "?") {
            fields.push({ name: "Version", value: getInput("version"), inline: true });
        }

        fields.push({
            name: "Build Branch",
            value: context.payload.ref?.toString().replace("refs/heads/", "") || "",
            inline: true
        });

        if (getInput('fields')) {
            const inputFields = JSON.parse(getInput('fields'));
            inputFields.forEach((field) => fields.push(field));
        }

        const embed = {
            title: `Build Commit`,
            description: `\`\`\`${lastCommit.data.commit.message}\`\`\``,
            url: `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
            color: getInput('webhook_embed_color'),
            fields: fields,
            author: {
                name: context.repo.repo,
                url: `https://github.com/${context.repo.owner}/${context.repo.repo}`,
                icon_url: `https://github.com/${context.repo.owner}.png`
            },
            timestamp: new Date().toISOString()
        };

        if (includeCommitInfo) {
            embed.footer = {
                text: lastCommit.data.author?.login || "",
                icon_url: lastCommit.data.author?.avatar_url || ""
            };
        }

        const json = {
            username: `${getInput("webhook_name")}`,
            avatar_url: `${getInput("webhook_logo")}`,
            embeds: [embed]
        };

        console.log(`Post body: ${JSON.stringify(json)}`);
        await axios.post(getInput("webhook_url"), json, {
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error) {
        console.error(`Failed: ${error}`);
        setFailed(error.message);
    }
}

run();