module.exports = {

    //----------------------------------------------------------------------------------
    // Ran when the dashboard if first started    
    init: async (DBM, Dashboard) => {
        Dashboard.app.post("/api/:serverID/execute/:command", (req, res) => {
            if (!req.user) return res.redirect("/dashboard/@me");

            let commandName = req.params.command.toLowerCase().replace(/ /g,"_");
            let command = Dashboard.Actions.mods.get(commandName);
            if (command && commandName) {
                const path = require("path").join(__dirname, "../../mods", commandName, command.scriptFile);
                const commandFound = require(path);
                if (!commandFound) return res.status(500);
                req.user.commandRan = true;

                req.user.commandExecuted = commandFound.run(DBM, req, res, Dashboard);
                res.redirect(`/dashboard/@me/servers/${req.params.serverID}`);
            };
        });
    },
    //----------------------------------------------------------------------------------

    run: (DBM, req, res, Dashboard) => {
        let server = DBM.Bot.bot.guilds.cache.get(req.params.serverID);
        if (!server) {
            res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${DBM.Bot.bot.user.id}&scope=bot&permissions=2146958591&guild_id=${req.params.serverID}`);
            return {
                skipRender: true
            };
        } else {
            console.log(server.memberCount)
            let owners = Dashboard.settings.owner;
            if (!owners.includes(req.user.id)) {
                res.redirect("/dashboard/@me");
                return {
                    skipRender: true
                };
            };
    
            let sections = [];
            let panelMods = [];
            Dashboard.Actions.mods.forEach(mod => {
                if (mod.dashboardMod) {
                    panelMods.push(mod);
                    sections.push(mod.section);
                };
            });
    
            let extensions = [];
            Dashboard.Actions.extensions.forEach(extension => {
                if (extension.dashboardMod) {
                    extensions.push(extension);
                };
            });
    
            return {
                "user": req.user,
                "settings": Dashboard.settings,
                "client": DBM.Bot.bot,
                "theme": Dashboard.settings.theme,
                "mods": panelMods,
                "sections": sections,
                "extensions": extensions,
                "commandData": req.user.commandExecuted,
                "path": require("path"),
                "dirname": __dirname,
                "server": server,
                "commands": DBM.Files.data.commands
            };
        };
    }
};;