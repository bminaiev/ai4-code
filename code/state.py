from dataclasses import dataclass
from config import Config
import pandas as pd
from tqdm import tqdm
import common

@dataclass
class State:
    # TODO: wrong types. How does it work? :)
    df_orders:list
    test_df:list
    df_ancestors:list
    all_train_nb:list
    all_validate_nb:list


    def __init__(self):
        pass

    def load_df_orders(self, config:Config):
        self.df_orders = pd.read_csv(
            config.data_dir / 'train_orders.csv',
            index_col='id',
        ).squeeze("columns").str.split()  # Split the string representation of cell_ids into a list

    def load_test_nbs(self, config:Config):
        paths_test = list((config.data_dir / 'test').glob('*.json'))
        notebooks_test = [
            common.read_notebook(path) for path in tqdm(paths_test, desc='Test NBs')
        ]
        self.test_df = (
            pd.concat(notebooks_test)
            .set_index('id', append=True)
            .swaplevel()
            .sort_index(level='id', sort_remaining=False)
        )

    def load_df_ancestors(self, config:Config):
        self.df_ancestors = pd.read_csv(config.data_dir / 'train_ancestors.csv', index_col='id')

        # TODO: rewrite this to use the dataframe
        cnt_by_group = {}
        for id, row in tqdm(self.df_ancestors.iterrows()):
            cnt_by_group[row['ancestor_id']] = cnt_by_group.get(row['ancestor_id'], 0) + 1


        cnt = pd.Series(cnt_by_group)
        print('only one:', cnt[cnt == 1].count())
        cnt.plot.hist(grid=True, bins=20, rwidth=0.9,
                        color='#607c8e')
        cnt

        good_notebooks = []
        for id, row in tqdm(self.df_ancestors.iterrows()):
            if row['parent_id'] != None and cnt_by_group[row['ancestor_id']] == 1:
                good_notebooks.append(id)

        good_notebooks = pd.Series(good_notebooks)
        print('good notebooks', len(good_notebooks))

        self.all_train_nb = good_notebooks.sample(frac=0.9, random_state=787788)
        self.all_validate_nb = good_notebooks.drop(self.all_train_nb.index)

    def load_train_nbs(self, config:Config, num):
        global df

        paths_train = [config.data_dir / 'train' / '{}.json'.format(id) for id in self.all_train_nb.head(num)]
        notebooks_train = [
            common.read_notebook(path) for path in tqdm(paths_train, desc='Train NBs')
        ]
        df = (
            pd.concat(notebooks_train)
            .set_index('id', append=True)
            .swaplevel()
            .sort_index(level='id', sort_remaining=False)
        )

        df


    def hello(self):
        print('hello')