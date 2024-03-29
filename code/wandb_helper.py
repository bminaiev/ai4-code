import wandb
from config import Config


def login(config: Config):
    wb_key = open(config.wandb_key, "r").read()
    wandb.login(key=wb_key)


def init_wandb(name, config={}):
    config = config.copy()
    config['name'] = 'Train'

    wandb.init(project="ai4code", name=name, config=config)
